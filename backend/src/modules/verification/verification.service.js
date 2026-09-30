import { verificationRepository } from './verification.repository.js';
import { assetRepository } from '../assets/asset.repository.js';
import { inngest } from '../../config/inngest.config.js';
import { NotFoundError } from '../../common/errors/index.js';
import { AssetStatus, VerificationStatus } from '../../common/constants/asset-types.constant.js';

export class VerificationService {
  constructor(repo = verificationRepository, assetRepo = assetRepository) {
    this.repo = repo;
    this.assetRepo = assetRepo;
  }

  async requestVerification(requestedBy, assetId) {
    const asset = await this.assetRepo.findById(assetId);
    if (!asset) {
      throw new NotFoundError('Asset not found');
    }

    const verification = await this.repo.create({
      assetId,
      requestedBy,
      status: VerificationStatus.SUBMITTED,
    });

    await this.assetRepo.updateById(assetId, {
      status: AssetStatus.PENDING_VERIFICATION,
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

  async getVerificationStatus(assetId) {
    const verification = await this.repo.findByAssetId(assetId);
    if (!verification) {
      throw new NotFoundError('No verification record found for this asset');
    }
    return verification;
  }
}

export const verificationService = new VerificationService();
