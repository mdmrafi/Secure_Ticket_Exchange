/**
 * System Event Names for Inngest Event-Driven Architecture
 */
export const EventNames = Object.freeze({
  USER_CREATED: 'user.created',
  KYC_COMPLETED: 'kyc.completed',
  ASSET_CREATED: 'asset.created',
  ASSET_VERIFIED: 'asset.verified',
  LISTING_CREATED: 'listing.created',
  LISTING_RESERVED: 'listing.reserved',
  TRANSACTION_CREATED: 'transaction.created',
  PAYMENT_COMPLETED: 'payment.completed',
  TRANSFER_COMPLETED: 'transfer.completed',
  FRAUD_DETECTED: 'fraud.detected',
  REPORT_CREATED: 'report.created',

  // Operational events
  VERIFICATION_RETRY_REQUESTED: 'verification.retry.requested',
  RESERVATION_CLEANUP_REQUESTED: 'reservation.cleanup.requested',
});

/**
 * Inngest Background Job Identifiers
 */
export const JobIds = Object.freeze({
  AUDIT_PROCESSING: 'audit-processing-job',
  NOTIFICATIONS: 'in-app-notifications-job',
  EMAIL_NOTIFICATIONS: 'email-notifications-job',
  CLEANUP_EXPIRED_RESERVATIONS_CRON: 'cleanup-expired-reservations-cron-job',
  CLEANUP_EXPIRED_RESERVATIONS_EVENT: 'cleanup-expired-reservations-event-job',
  VERIFICATION_RETRIES: 'verification-retries-job',
  TRANSACTION_REMINDERS: 'transaction-reminders-job',
});

/**
 * List of all 11 core domain events
 */
export const CORE_DOMAIN_EVENTS = Object.freeze([
  EventNames.USER_CREATED,
  EventNames.KYC_COMPLETED,
  EventNames.ASSET_CREATED,
  EventNames.ASSET_VERIFIED,
  EventNames.LISTING_CREATED,
  EventNames.LISTING_RESERVED,
  EventNames.TRANSACTION_CREATED,
  EventNames.PAYMENT_COMPLETED,
  EventNames.TRANSFER_COMPLETED,
  EventNames.FRAUD_DETECTED,
  EventNames.REPORT_CREATED,
]);
