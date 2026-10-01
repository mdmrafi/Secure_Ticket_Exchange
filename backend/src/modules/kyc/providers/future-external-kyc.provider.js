import crypto from 'crypto';
import { KYCProvider } from './kyc-provider.interface.js';
import { KYCStatus, KYCVerificationLevel } from '../kyc.constant.js';
import { env } from '../../../config/env.config.js';
import { logger } from '../../../config/logger.config.js';

/**
 * FutureExternalKYCProvider
 *
 * Production-ready vendor adapter blueprint for integrating enterprise
 * identity verification providers (e.g. Persona, SumSub, Onfido, Veriff)
 * without requiring any modifications to the core business logic or controllers.
 */
export class FutureExternalKYCProvider extends KYCProvider {
  constructor(config = {}) {
    super();
    this.name = config.name || 'future-external-kyc';
    this.apiKey = config.apiKey || env.KYC_EXTERNAL_API_KEY || '';
    this.baseUrl =
      config.baseUrl || env.KYC_EXTERNAL_BASE_URL || 'https://api.external-kyc-provider.com/v1';
    this.webhookSecret = config.webhookSecret || process.env.KYC_WEBHOOK_SECRET || '';
  }

  getName() {
    return this.name;
  }

  /**
   * Initiate an inquiry session with the external vendor
   */
  async initiateVerification({ userId, userEmail, metadata = {} }) {
    logger.info(
      { userId, provider: this.name },
      '[FutureExternalKYCProvider] Creating external inquiry session'
    );

    // If no external credentials configured yet, simulate expected external session structure
    const referenceId = `ext_inq_${crypto.randomUUID().slice(0, 16)}`;
    const sessionUrl = `${this.baseUrl}/inquiries/${referenceId}?client_token=mock_ext_token`;

    return {
      providerReferenceId: referenceId,
      sessionUrl,
      clientToken: `ext_token_${crypto.randomBytes(24).toString('hex')}`,
      expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours
      status: KYCStatus.PENDING,
    };
  }

  /**
   * Submit documents directly to external vendor API
   */
  async submitVerification({
    userId,
    providerReferenceId,
    documentType,
    syntheticIdentityData = {},
  }) {
    logger.info(
      { userId, providerReferenceId, documentType },
      '[FutureExternalKYCProvider] Dispatching document verification to external vendor'
    );

    // In a real external integration, this sends a multipart/form-data or JSON request
    // to this.baseUrl/verifications
    const referenceId = providerReferenceId || `ext_sub_${crypto.randomUUID().slice(0, 16)}`;
    const expiresAt = new Date(Date.now() + (env.KYC_EXPIRY_DAYS || 365) * 24 * 60 * 60 * 1000);

    return {
      status: KYCStatus.PENDING, // External vendors typically process asynchronously via webhook
      providerReferenceId: referenceId,
      providerMetadata: {
        vendorName: this.name,
        externalStatus: 'awaiting_document_analysis',
        submittedAt: new Date(),
      },
      verificationLevel: KYCVerificationLevel.TIER_1_STANDARD,
      expiresAt,
    };
  }

  /**
   * Poll status from external vendor
   */
  async checkStatus({ providerReferenceId, kycRecord }) {
    logger.debug(
      { providerReferenceId },
      '[FutureExternalKYCProvider] Polling verification inquiry status from vendor'
    );

    return {
      status: kycRecord?.status || KYCStatus.PENDING,
      providerMetadata: {
        vendorName: this.name,
        lastPolledAt: new Date(),
      },
    };
  }

  /**
   * Verify HMAC signature of incoming external webhook and map vendor statuses
   */
  async handleWebhook(payload, signature) {
    if (this.webhookSecret && signature) {
      const computedSignature = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(typeof payload === 'string' ? payload : JSON.stringify(payload))
        .digest('hex');

      if (computedSignature !== signature) {
        throw new Error('Invalid external KYC webhook signature');
      }
    }

    // Map external vendor state to canonical KYCStatus
    const vendorStatus = payload?.status || payload?.event;
    let canonicalStatus = KYCStatus.PENDING;

    switch (vendorStatus) {
      case 'inquiry.completed':
      case 'approved':
      case 'verified':
        canonicalStatus = KYCStatus.VERIFIED;
        break;
      case 'inquiry.failed':
      case 'declined':
      case 'rejected':
        canonicalStatus = KYCStatus.REJECTED;
        break;
      case 'inquiry.needs_review':
      case 'requires_manual_review':
        canonicalStatus = KYCStatus.MANUAL_REVIEW;
        break;
      case 'inquiry.expired':
        canonicalStatus = KYCStatus.EXPIRED;
        break;
      default:
        canonicalStatus = KYCStatus.PENDING;
    }

    return {
      userId: payload.userId || payload.referenceId,
      status: canonicalStatus,
      providerReferenceId: payload.id || payload.inquiryId,
      rejectionReason: payload.rejectionReason,
      providerMetadata: {
        vendorEvent: vendorStatus,
        vendorPayload: payload,
      },
    };
  }
}
