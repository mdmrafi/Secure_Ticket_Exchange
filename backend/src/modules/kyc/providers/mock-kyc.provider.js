import crypto from 'crypto';
import { KYCProvider } from './kyc-provider.interface.js';
import { KYCStatus, KYCVerificationLevel } from '../kyc.constant.js';
import { env } from '../../../config/env.config.js';
import { logger } from '../../../config/logger.config.js';

export class MockKYCProvider extends KYCProvider {
  constructor() {
    super();
    this.name = 'mock';
  }

  getName() {
    return this.name;
  }

  /**
   * Initiate a synthetic KYC verification session
   */
  async initiateVerification({ userId, userEmail, metadata = {} }) {
    const referenceId = `mock_kyc_inq_${crypto.randomUUID().slice(0, 12)}`;
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1-hour session validity

    logger.debug(
      { userId, referenceId },
      '[MockKYCProvider] Initiated synthetic identity verification session'
    );

    return {
      providerReferenceId: referenceId,
      sessionUrl: `https://mock-kyc.secure-ticket-exchange.internal/verify/${referenceId}`,
      clientToken: `mock_token_${crypto.randomBytes(16).toString('hex')}`,
      expiresAt,
      status: KYCStatus.PENDING,
    };
  }

  /**
   * Submit synthetic identity verification data and evaluate mock rules
   */
  async submitVerification({
    userId,
    providerReferenceId,
    documentType,
    syntheticIdentityData = {},
  }) {
    const referenceId = providerReferenceId || `mock_kyc_sub_${crypto.randomUUID().slice(0, 12)}`;
    const docNumber = (syntheticIdentityData.documentNumber || '').toString().trim().toUpperCase();
    const testOutcome = syntheticIdentityData.testOutcome;

    logger.info(
      { userId, referenceId, documentType },
      '[MockKYCProvider] Evaluating synthetic identity submission'
    );

    // Development safety: Ensure mock data is clearly synthetic
    const isSynthetic =
      syntheticIdentityData.isSynthetic !== false ||
      docNumber.startsWith('SYN') ||
      docNumber.startsWith('MOCK') ||
      docNumber.startsWith('TEST') ||
      Boolean(testOutcome);

    if (!isSynthetic) {
      logger.warn(
        { userId, referenceId },
        '[MockKYCProvider] Notice: Always use synthetic/mock identity data during development'
      );
    }

    // Expiry calculation: default configured expiry days (e.g. 365 days)
    const expiryDays = env.KYC_EXPIRY_DAYS || 365;
    const documentExpiresAt = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000);

    // Rule 1: Synthetic Rejection Trigger
    if (
      testOutcome === KYCStatus.REJECTED ||
      testOutcome === 'REJECT' ||
      docNumber.includes('REJECT') ||
      docNumber.endsWith('0000')
    ) {
      return {
        status: KYCStatus.REJECTED,
        providerReferenceId: referenceId,
        rejectionReason:
          syntheticIdentityData.rejectionReason ||
          'Synthetic fraud check failed: Document number flagged in synthetic rejection registry.',
        providerMetadata: {
          mockEngine: 'MockKYC-Engine-v2',
          isSynthetic: true,
          checks: {
            ocrSanity: 'FAILED',
            livenessDetection: 'PASSED',
            sanctionsWatchlist: 'FLAGGED',
            tamperingDetection: 'FAILED',
          },
          fraudRiskScore: 92,
          evaluatedAt: new Date(),
        },
        verificationLevel: KYCVerificationLevel.TIER_1_STANDARD,
        expiresAt: null,
      };
    }

    // Rule 2: Synthetic Manual Review Trigger
    if (
      testOutcome === KYCStatus.MANUAL_REVIEW ||
      testOutcome === 'MANUAL_REVIEW' ||
      docNumber.includes('REVIEW') ||
      docNumber.endsWith('9999')
    ) {
      return {
        status: KYCStatus.MANUAL_REVIEW,
        providerReferenceId: referenceId,
        reviewNotes:
          'Synthetic OCR quality borderline (64%). Manual compliance specialist review requested.',
        providerMetadata: {
          mockEngine: 'MockKYC-Engine-v2',
          isSynthetic: true,
          checks: {
            ocrSanity: 'FLAGGED',
            livenessDetection: 'PASSED',
            sanctionsWatchlist: 'CLEARED',
            tamperingDetection: 'PASSED',
          },
          confidenceScore: 64,
          evaluatedAt: new Date(),
        },
        verificationLevel: KYCVerificationLevel.TIER_1_STANDARD,
        expiresAt: null,
      };
    }

    // Rule 3: Synthetic Expired Trigger
    if (
      testOutcome === KYCStatus.EXPIRED ||
      testOutcome === 'EXPIRED' ||
      docNumber.includes('EXPIRED')
    ) {
      return {
        status: KYCStatus.EXPIRED,
        providerReferenceId: referenceId,
        rejectionReason: 'Synthetic identity document expired according to synthetic registry.',
        providerMetadata: {
          mockEngine: 'MockKYC-Engine-v2',
          isSynthetic: true,
          checks: {
            ocrSanity: 'EXPIRED',
          },
          evaluatedAt: new Date(),
        },
        verificationLevel: KYCVerificationLevel.TIER_1_STANDARD,
        expiresAt: null,
      };
    }

    // Rule 4: Default -> Synthetic Verification Passed
    return {
      status: KYCStatus.VERIFIED,
      providerReferenceId: referenceId,
      providerMetadata: {
        mockEngine: 'MockKYC-Engine-v2',
        isSynthetic: true,
        checks: {
          ocrSanity: 'PASSED',
          livenessDetection: 'PASSED',
          sanctionsWatchlist: 'CLEARED',
          faceMatchConfidence: 99.2,
          tamperingDetection: 'PASSED',
        },
        confidenceScore: 98.6,
        evaluatedAt: new Date(),
      },
      verificationLevel: KYCVerificationLevel.TIER_1_STANDARD,
      expiresAt: documentExpiresAt,
    };
  }

  /**
   * Check status of synthetic inquiry
   */
  async checkStatus({ providerReferenceId, kycRecord }) {
    return {
      status: kycRecord?.status || KYCStatus.PENDING,
      providerMetadata: {
        checkedAt: new Date(),
        provider: this.name,
      },
    };
  }

  /**
   * Process simulated webhook callback
   */
  async handleWebhook(payload, signature) {
    return {
      userId: payload.userId,
      status: payload.status || KYCStatus.VERIFIED,
      providerReferenceId: payload.referenceId,
      providerMetadata: payload.metadata || {},
    };
  }
}
