/**
 * KYC Status constants representing user identity verification lifecycle states
 */
export const KYCStatus = Object.freeze({
  NOT_STARTED: 'NOT_STARTED',
  PENDING: 'PENDING',
  VERIFIED: 'VERIFIED',
  REJECTED: 'REJECTED',
  EXPIRED: 'EXPIRED',
  MANUAL_REVIEW: 'MANUAL_REVIEW',
});

/**
 * Supported synthetic document types for KYC verification
 */
export const KYCDocumentType = Object.freeze({
  NATIONAL_ID: 'NATIONAL_ID',
  PASSPORT: 'PASSPORT',
  DRIVING_LICENSE: 'DRIVING_LICENSE',
  RESIDENCE_PERMIT: 'RESIDENCE_PERMIT',
});

/**
 * KYC Audit Actions for compliance and audit trail tracking
 */
export const KYCAuditAction = Object.freeze({
  SESSION_STARTED: 'SESSION_STARTED',
  SUBMITTED: 'SUBMITTED',
  VERIFIED: 'VERIFIED',
  REJECTED: 'REJECTED',
  MANUAL_REVIEW_REQUESTED: 'MANUAL_REVIEW_REQUESTED',
  EXPIRED: 'EXPIRED',
  RESET: 'RESET',
});

/**
 * KYC Verification Tiers
 */
export const KYCVerificationLevel = Object.freeze({
  TIER_1_STANDARD: 'TIER_1_STANDARD',
  TIER_2_ENHANCED: 'TIER_2_ENHANCED',
});
