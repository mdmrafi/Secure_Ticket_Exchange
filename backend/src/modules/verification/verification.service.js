import { verificationRepository } from './verification.repository.js';
import { assetRepository } from '../assets/asset.repository.js';
import { inngest } from '../../config/inngest.config.js';
import { NotFoundError, ForbiddenError } from '../../common/errors/index.js';
import { AssetStatus, VerificationStatus, AssetTypes } from '../../common/constants/asset-types.constant.js';
import { getAssetVerifier } from './verifiers/asset-verifier.factory.js';
import { verificationEngine } from './engine/verification-engine.js';
import { logger } from '../../config/logger.config.js';
import { publishEvent } from '../../jobs/publisher.js';
import { EventNames } from '../../common/constants/events.constant.js';

export class VerificationService {
  constructor(repo = verificationRepository, assetRepo = assetRepository, engine = verificationEngine) {
    this.repo = repo;
    this.assetRepo = assetRepo;
    this.engine = engine;
  }

  /**
   * Request verification for an asset (queues async or immediate evaluation)
   */
  async requestVerification(requestedBy, assetId, options = {}) {
    const asset = await this.assetRepo.findById(assetId);
    if (!asset) {
      throw new NotFoundError('Asset not found');
    }

    // If it's a railway ticket, execute multi-layer verification immediately
    if (asset.assetType === AssetTypes.RAILWAY_TICKET) {
      return this.verifyRailwayTicket(assetId, { userId: requestedBy }, options);
    }

    const verification = await this.repo.create({
      assetId,
      requestedBy,
      status: VerificationStatus.SUBMITTED,
    });

    await this.assetRepo.updateById(assetId, {
      status: AssetStatus.PENDING_VERIFICATION,
      verificationStatus: VerificationStatus.SUBMITTED,
    });

    // Trigger Inngest async verification job
    await inngest.send({
      name: 'asset/verification.requested',
      data: {
        assetId,
        verificationId: verification._id,
        assetType: asset.assetType,
      },
    });

    return verification;
  }

  /**
   * Perform comprehensive multi-layer verification on a Railway Ticket
   *
   * @param {string} assetId
   * @param {object} requestingUser
   * @param {object} [options]
   */
  async verifyRailwayTicket(assetId, requestingUser, options = {}) {
    const asset = await this.assetRepo.findById(assetId);
    if (!asset) {
      throw new NotFoundError('Asset not found');
    }

    // Ownership check (owner or admin)
    if (requestingUser) {
      const assetOwnerId = asset.ownerId?._id
        ? asset.ownerId._id.toString()
        : asset.ownerId.toString();
      const isOwner = assetOwnerId === requestingUser.userId.toString();
      const isAdmin = requestingUser.role === 'ADMIN';

      if (!isOwner && !isAdmin) {
        throw new ForbiddenError('Forbidden: You can only request verification for your own assets');
      }
    }

    logger.info({ assetId, userId: requestingUser?.userId }, 'Running multi-layer railway ticket verification');

    // Run verification engine across all 6 layers
    const result = await this.engine.verifyRailwayTicket(asset, options);

    // Map result status to Asset model status
    const updatePayload = {
      verificationStatus: result.status,
    };

    if (result.status === VerificationStatus.VERIFIED) {
      updatePayload.status = AssetStatus.VERIFIED;
      updatePayload.verifiedAt = new Date();
    } else if (result.status === VerificationStatus.FAILED || result.status === VerificationStatus.SUSPICIOUS) {
      updatePayload.status = AssetStatus.REJECTED;
    } else if (result.status === VerificationStatus.MANUAL_REVIEW) {
      updatePayload.status = AssetStatus.PENDING_VERIFICATION;
    }

    await this.assetRepo.updateById(assetId, updatePayload);

    // Record verification record in database
    const verificationRecord = await this.repo.create({
      assetId,
      requestedBy: requestingUser?.userId || asset.ownerId,
      status: result.status,
      confidenceScore: result.overallConfidenceScore,
      checks: result.checks.map((c) => ({
        checkType: c.layer,
        status: c.status === 'PASSED' ? 'PASSED' : (c.status === 'FAILED' ? 'FAILED' : 'PENDING'),
        score: c.score || 0,
        details: { ...c.details, reason: c.reason },
        performedAt: new Date(),
      })),
      fraudFlags: result.fraudFlags || [],
      notes: result.primaryReason,
      completedAt: new Date(),
    });

    if (result.status === VerificationStatus.VERIFIED) {
      publishEvent(
        EventNames.ASSET_VERIFIED,
        {
          assetId,
          ownerId: asset.ownerId?._id?.toString() || asset.ownerId?.toString(),
          verificationId: verificationRecord._id.toString(),
          status: result.status,
          confidenceScore: result.overallConfidenceScore,
        },
        { id: requestingUser?.userId || asset.ownerId }
      ).catch(() => {});
    }

    return {
      ...result,
      verificationId: verificationRecord._id,
    };
  }

  async runAssetVerification(assetId) {
    const asset = await this.assetRepo.findById(assetId);
    if (!asset) {
      throw new NotFoundError('Asset not found');
    }

    if (asset.assetType === AssetTypes.RAILWAY_TICKET) {
      return this.verifyRailwayTicket(assetId, { userId: asset.ownerId });
    }

    const verifier = getAssetVerifier(asset.assetType);
    const result = await verifier.verify(asset);

    await this.assetRepo.updateById(assetId, {
      verificationStatus: result.status,
    });

    if (result.status === VerificationStatus.VERIFIED) {
      publishEvent(
        EventNames.ASSET_VERIFIED,
        {
          assetId,
          ownerId: asset.ownerId?._id?.toString() || asset.ownerId?.toString(),
          status: result.status,
        },
        { id: asset.ownerId }
      ).catch(() => {});
    }

    return result;
  }

  async getVerificationStatus(assetId) {
    const verification = await this.repo.findByAssetId(assetId);
    if (!verification) {
      throw new NotFoundError('No verification record found for this asset');
    }
    return verification;
  }
}

export const verificationService = new VerificationService();
