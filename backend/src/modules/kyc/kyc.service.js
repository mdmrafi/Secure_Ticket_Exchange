import { kycRepository } from './kyc.repository.js';
import { getKYCProvider } from './providers/kyc-provider.factory.js';
import { KYCStatus, KYCAuditAction, KYCVerificationLevel } from './kyc.constant.js';
import {
  encryptKYCData,
  hashDocumentNumber,
  maskDocumentNumber,
} from './utils/kyc-crypto.util.js';
import { User } from '../users/user.model.js';
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
  ForbiddenError,
} from '../../common/errors/index.js';
import { logger } from '../../config/logger.config.js';
import { publishEvent } from '../../jobs/publisher.js';
import { EventNames } from '../../common/constants/events.constant.js';

export class KYCService {
  constructor(repo = kycRepository) {
    this.repo = repo;
  }

  /**
   * Helper to format a safe, sanitized DTO for external responses.
   * Strips all internal tokens, raw hashes, and encrypted PII.
   */
  formatKYCStatusDTO(record) {
    if (!record) {
      return {
        status: KYCStatus.NOT_STARTED,
        isVerified: false,
        message: 'Identity verification has not been initiated.',
      };
    }

    const isVerified = record.status === KYCStatus.VERIFIED;

    return {
      verificationId: record._id,
      status: record.status,
      isVerified,
      provider: record.provider,
      providerReferenceId: record.providerReferenceId || null,
      verificationLevel: record.verificationLevel || KYCVerificationLevel.TIER_1_STANDARD,
      documentType: record.documentType || null,
      documentNumberMasked: record.documentNumberMasked || null,
      startedAt: record.startedAt || null,
      submittedAt: record.submittedAt || null,
      verifiedAt: record.verifiedAt || null,
      rejectedAt: record.rejectedAt || null,
      expiresAt: record.expiresAt || null,
      rejectionReason: record.status === KYCStatus.REJECTED ? record.rejectionReason : null,
      reviewNotes: record.status === KYCStatus.MANUAL_REVIEW ? record.reviewNotes : null,
      attemptsCount: record.attemptsCount || 0,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  /**
   * Start a new KYC verification session: POST /api/v1/kyc/start
   * @param {string} userId
   * @param {object} options
   * @param {object} clientContext
   */
  async startKYC(userId, options = {}, clientContext = {}) {
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError('User account not found');
    }

    const existingRecord = await this.repo.findByUserId(userId);

    // If user is already verified and not expired, prevent redundant verification
    if (existingRecord && existingRecord.status === KYCStatus.VERIFIED) {
      const isExpired = existingRecord.expiresAt && new Date(existingRecord.expiresAt) < new Date();
      if (!isExpired) {
        throw new ConflictError(
          'Your identity has already been verified and is active. Re-verification is not permitted.'
        );
      }
    }

    const fromStatus = existingRecord ? existingRecord.status : KYCStatus.NOT_STARTED;
    const provider = getKYCProvider();

    // Initiate provider session
    const providerSession = await provider.initiateVerification({
      userId: user._id.toString(),
      userEmail: user.email,
      metadata: options.metadata || {},
    });

    const updatePayload = {
      userId: user._id,
      status: KYCStatus.PENDING,
      provider: provider.getName(),
      providerReferenceId: providerSession.providerReferenceId,
      documentType: options.documentType || undefined,
      startedAt: new Date(),
      attemptsCount: (existingRecord?.attemptsCount || 0) + 1,
      providerMetadata: {
        sessionUrl: providerSession.sessionUrl,
        clientToken: providerSession.clientToken,
        initiatedAt: new Date(),
      },
      rejectionReason: null,
      reviewNotes: null,
    };

    const kycRecord = await this.repo.upsertByUserId(userId, updatePayload);

    // Update user summary state
    await User.findByIdAndUpdate(userId, { kycStatus: KYCStatus.PENDING });

    // Record audit trail
    await this.repo.createAuditLog({
      kycId: kycRecord._id,
      userId: user._id,
      fromStatus,
      toStatus: KYCStatus.PENDING,
      action: KYCAuditAction.SESSION_STARTED,
      changedBy: 'USER',
      changedByUserId: user._id,
      reason: 'User initiated identity verification session',
      ipAddress: clientContext.ip,
      userAgent: clientContext.userAgent,
      metadata: {
        provider: provider.getName(),
        providerReferenceId: providerSession.providerReferenceId,
      },
    });

    logger.info(
      { userId, kycId: kycRecord._id, provider: provider.getName() },
      'KYC verification session initiated successfully'
    );

    return {
      ...this.formatKYCStatusDTO(kycRecord),
      providerSession: {
        sessionUrl: providerSession.sessionUrl,
        clientToken: providerSession.clientToken,
        expiresAt: providerSession.expiresAt,
      },
    };
  }

  /**
   * Submit synthetic KYC verification data: POST /api/v1/kyc/submit
   * @param {string} userId
   * @param {object} submissionData
   * @param {object} clientContext
   */
  async submitKYC(userId, submissionData, clientContext = {}) {
    const { documentType, syntheticData } = submissionData;

    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError('User account not found');
    }

    const kycRecord = await this.repo.findByUserId(userId);
    if (!kycRecord || kycRecord.status === KYCStatus.NOT_STARTED) {
      throw new BadRequestError(
        'Identity verification session has not been started. Please call POST /api/v1/kyc/start first.'
      );
    }

    if (kycRecord.status === KYCStatus.VERIFIED) {
      throw new ConflictError(
        'Identity is already verified. No further submission is required.'
      );
    }

    const fromStatus = kycRecord.status;
    const documentNumber = syntheticData.documentNumber.trim();

    // 1. Calculate deterministic document hash for anti-duplication without plaintext storage
    const documentHash = hashDocumentNumber(documentNumber);
    const isDuplicate = await this.repo.isDocumentDuplicate(documentHash, userId);
    if (isDuplicate) {
      logger.warn({ userId }, 'Duplicate synthetic document number detected across distinct accounts');
    }

    // 2. Encrypt sensitive PII using AES-256-GCM
    const encryptedIdentityData = encryptKYCData({
      firstName: syntheticData.firstName,
      lastName: syntheticData.lastName,
      dateOfBirth: syntheticData.dateOfBirth,
      documentNumber,
      countryCode: syntheticData.countryCode || 'BD',
    });

    // 3. Mask document number for safe display
    const documentNumberMasked = maskDocumentNumber(documentNumber);

    // 4. Resolve KYC provider and evaluate
    const provider = getKYCProvider(kycRecord.provider);
    const evaluation = await provider.submitVerification({
      userId: user._id.toString(),
      providerReferenceId: kycRecord.providerReferenceId,
      documentType,
      syntheticIdentityData: syntheticData,
    });

    const toStatus = evaluation.status;
    const now = new Date();

    // 5. Build update document
    const updateData = {
      status: toStatus,
      documentType,
      documentNumberMasked,
      documentHash,
      encryptedIdentityData,
      submittedAt: now,
      verificationLevel: evaluation.verificationLevel || KYCVerificationLevel.TIER_1_STANDARD,
      providerMetadata: evaluation.providerMetadata || {},
    };

    if (toStatus === KYCStatus.VERIFIED) {
      updateData.verifiedAt = now;
      updateData.expiresAt = evaluation.expiresAt || new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
      updateData.rejectionReason = null;
      updateData.reviewNotes = null;
    } else if (toStatus === KYCStatus.REJECTED) {
      updateData.rejectedAt = now;
      updateData.rejectionReason = evaluation.rejectionReason || 'Identity verification failed';
    } else if (toStatus === KYCStatus.MANUAL_REVIEW) {
      updateData.reviewNotes = evaluation.reviewNotes || 'Under manual compliance review';
    } else if (toStatus === KYCStatus.EXPIRED) {
      updateData.rejectionReason = evaluation.rejectionReason || 'Document expired';
    }

    const updatedRecord = await this.repo.updateByUserId(userId, updateData);

    // 6. Update user summary fields
    const userUpdates = { kycStatus: toStatus };
    if (toStatus === KYCStatus.VERIFIED) {
      userUpdates.kycVerifiedAt = now;
    }
    await User.findByIdAndUpdate(userId, userUpdates);

    // 7. Determine audit action
    let auditAction = KYCAuditAction.SUBMITTED;
    if (toStatus === KYCStatus.VERIFIED) {
      auditAction = KYCAuditAction.VERIFIED;
    } else if (toStatus === KYCStatus.REJECTED) {
      auditAction = KYCAuditAction.REJECTED;
    } else if (toStatus === KYCStatus.MANUAL_REVIEW) {
      auditAction = KYCAuditAction.MANUAL_REVIEW_REQUESTED;
    }

    // 8. Create immutable audit log entry
    await this.repo.createAuditLog({
      kycId: updatedRecord._id,
      userId: user._id,
      fromStatus,
      toStatus,
      action: auditAction,
      changedBy: 'PROVIDER',
      reason: evaluation.rejectionReason || evaluation.reviewNotes || 'Verification completed by provider',
      ipAddress: clientContext.ip,
      userAgent: clientContext.userAgent,
      metadata: {
        provider: provider.getName(),
        providerReferenceId: kycRecord.providerReferenceId,
        verificationLevel: evaluation.verificationLevel,
      },
    });

    logger.info(
      { userId, kycId: updatedRecord._id, status: toStatus },
      'KYC identity submission evaluated and state updated'
    );

    // Asynchronously dispatch kyc.completed event for background jobs
    if (toStatus === KYCStatus.VERIFIED) {
      publishEvent(
        EventNames.KYC_COMPLETED,
        {
          kycId: updatedRecord._id.toString(),
          userId: user._id.toString(),
          email: user.email,
          name: user.name,
          verificationLevel: evaluation.verificationLevel,
          verifiedAt: now,
        },
        { id: user._id.toString(), email: user.email }
      ).catch(() => {});
    }

    // Return sanitized status
    return this.formatKYCStatusDTO(updatedRecord);
  }

  /**
   * Get KYC status for the authenticated user: GET /api/v1/kyc/status
   * @param {string} userId
   */
  async getKYCStatus(userId) {
    const kycRecord = await this.repo.findByUserId(userId);
    if (!kycRecord) {
      return this.formatKYCStatusDTO(null);
    }

    // Check expiration on verified records
    if (
      kycRecord.status === KYCStatus.VERIFIED &&
      kycRecord.expiresAt &&
      new Date(kycRecord.expiresAt) < new Date()
    ) {
      await this.repo.updateByUserId(userId, { status: KYCStatus.EXPIRED });
      await User.findByIdAndUpdate(userId, { kycStatus: KYCStatus.EXPIRED });

      await this.repo.createAuditLog({
        kycId: kycRecord._id,
        userId,
        fromStatus: KYCStatus.VERIFIED,
        toStatus: KYCStatus.EXPIRED,
        action: KYCAuditAction.EXPIRED,
        changedBy: 'SYSTEM',
        reason: 'Verification validity window has expired',
      });

      kycRecord.status = KYCStatus.EXPIRED;
    }

    return this.formatKYCStatusDTO(kycRecord);
  }

  /**
   * Secure access control method: Enforce user boundary when accessing KYC data
   * Only the owner or an ADMIN can view a user's KYC record.
   * @param {object} requestingUser
   * @param {string} targetUserId
   */
  async getKYCRecordByUserIdWithAuth(requestingUser, targetUserId) {
    if (!requestingUser) {
      throw new ForbiddenError('Authentication required');
    }

    const isOwner = requestingUser.userId.toString() === targetUserId.toString();
    const isAdmin = requestingUser.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      throw new ForbiddenError(
        'Forbidden: You are not authorized to access identity verification records for another user.'
      );
    }

    const record = await this.repo.findByUserId(targetUserId);
    if (!record) {
      throw new NotFoundError('KYC record not found for specified user');
    }

    return this.formatKYCStatusDTO(record);
  }
}

export const kycService = new KYCService();
