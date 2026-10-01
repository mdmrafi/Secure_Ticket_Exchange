import { inngest } from '../../config/inngest.config.js';
import { EventNames } from '../../common/constants/events.constant.js';
import { notificationService } from '../../modules/notifications/notification.service.js';
import { idempotencyService } from '../idempotency/idempotency.service.js';
import { logger } from '../../config/logger.config.js';

/**
 * 1. KYC Completed In-App Notification
 */
export const kycNotificationJob = inngest.createFunction(
  {
    id: 'notify-kyc-completed',
    name: 'Notification: KYC Completed',
    retries: 3,
    idempotency: 'event.id',
    onFailure: async ({ error, event }) => {
      logger.error({ error: error.message, eventId: event.id }, 'KYC notification failed');
    },
  },
  { event: EventNames.KYC_COMPLETED },
  async ({ event, step }) => {
    const eventId = event.id || event.data?.eventId;
    const userId = event.data?.userId || event.user?.id;

    if (!userId) return { skipped: true, reason: 'No userId provided' };

    return step.run('send-kyc-notification', async () => {
      return idempotencyService.executeIdempotent(
        { eventId, jobId: 'notify-kyc-completed', eventName: event.name },
        async () => {
          return notificationService.sendNotification(userId, {
            title: 'Identity Verification Approved',
            message: 'Your identity documents have been verified. You can now list high-trust assets.',
            type: 'SYSTEM',
            data: { kycId: event.data.kycId, verificationLevel: event.data.verificationLevel },
          });
        }
      );
    });
  }
);

/**
 * 2. Asset Verified In-App Notification
 */
export const assetVerifiedNotificationJob = inngest.createFunction(
  {
    id: 'notify-asset-verified',
    name: 'Notification: Asset Verified',
    retries: 3,
    idempotency: 'event.id',
    onFailure: async ({ error, event }) => {
      logger.error({ error: error.message, eventId: event.id }, 'Asset verified notification failed');
    },
  },
  { event: EventNames.ASSET_VERIFIED },
  async ({ event, step }) => {
    const eventId = event.id || event.data?.eventId;
    const recipientId = event.data?.ownerId || event.user?.id;

    if (!recipientId) return { skipped: true, reason: 'No ownerId provided' };

    return step.run('send-asset-verified-notification', async () => {
      return idempotencyService.executeIdempotent(
        { eventId, jobId: 'notify-asset-verified', eventName: event.name },
        async () => {
          return notificationService.sendNotification(recipientId, {
            title: 'Asset Verified Successfully',
            message: `Your asset (ID: ${event.data.assetId}) has passed multi-layer verification.`,
            type: 'ASSET_VERIFIED',
            data: {
              assetId: event.data.assetId,
              confidenceScore: event.data.confidenceScore,
            },
          });
        }
      );
    });
  }
);

/**
 * 3. Listing Reserved In-App Notification
 */
export const listingReservedNotificationJob = inngest.createFunction(
  {
    id: 'notify-listing-reserved',
    name: 'Notification: Listing Reserved',
    retries: 3,
    idempotency: 'event.id',
    onFailure: async ({ error, event }) => {
      logger.error({ error: error.message, eventId: event.id }, 'Listing reserved notification failed');
    },
  },
  { event: EventNames.LISTING_RESERVED },
  async ({ event, step }) => {
    const eventId = event.id || event.data?.eventId;
    const { sellerId, buyerId, listingId, expiresAt } = event.data;

    return step.run('send-reservation-notifications', async () => {
      return idempotencyService.executeIdempotent(
        { eventId, jobId: 'notify-listing-reserved', eventName: event.name },
        async () => {
          const notifications = [];

          // Notify Seller
          if (sellerId) {
            const sellerNotif = await notificationService.sendNotification(sellerId, {
              title: 'Listing Reserved',
              message: `A buyer has reserved your listing #${listingId}. Awaiting payment.`,
              type: 'LISTING',
              data: { listingId, expiresAt },
            });
            notifications.push(sellerNotif);
          }

          // Notify Buyer
          if (buyerId) {
            const buyerNotif = await notificationService.sendNotification(buyerId, {
              title: 'Reservation Confirmed',
              message: `You have successfully reserved listing #${listingId}. Please proceed to payment before reservation expires.`,
              type: 'LISTING',
              data: { listingId, expiresAt },
            });
            notifications.push(buyerNotif);
          }

          return notifications;
        }
      );
    });
  }
);

/**
 * 4. Transaction Created In-App Notification
 */
export const transactionCreatedNotificationJob = inngest.createFunction(
  {
    id: 'notify-transaction-created',
    name: 'Notification: Transaction Created',
    retries: 3,
    idempotency: 'event.id',
    onFailure: async ({ error, event }) => {
      logger.error({ error: error.message, eventId: event.id }, 'Transaction created notification failed');
    },
  },
  { event: EventNames.TRANSACTION_CREATED },
  async ({ event, step }) => {
    const eventId = event.id || event.data?.eventId;
    const { buyerId, sellerId, transactionId, amount, currency } = event.data;

    return step.run('send-transaction-created-notification', async () => {
      return idempotencyService.executeIdempotent(
        { eventId, jobId: 'notify-transaction-created', eventName: event.name },
        async () => {
          const notifications = [];

          if (buyerId) {
            const bNotif = await notificationService.sendNotification(buyerId, {
              title: 'Order Initiated',
              message: `Order #${transactionId} initiated for ${amount} ${currency || 'BDT'}. Complete payment to finalize.`,
              type: 'TRANSACTION',
              data: { transactionId, amount },
            });
            notifications.push(bNotif);
          }

          if (sellerId) {
            const sNotif = await notificationService.sendNotification(sellerId, {
              title: 'New Order Received',
              message: `Order #${transactionId} created for your listed asset. Awaiting payment authorization.`,
              type: 'TRANSACTION',
              data: { transactionId, amount },
            });
            notifications.push(sNotif);
          }

          return notifications;
        }
      );
    });
  }
);

/**
 * 5. Payment Completed In-App Notification
 */
export const paymentCompletedNotificationJob = inngest.createFunction(
  {
    id: 'notify-payment-completed',
    name: 'Notification: Payment Completed',
    retries: 3,
    idempotency: 'event.id',
    onFailure: async ({ error, event }) => {
      logger.error({ error: error.message, eventId: event.id }, 'Payment completed notification failed');
    },
  },
  { event: EventNames.PAYMENT_COMPLETED },
  async ({ event, step }) => {
    const eventId = event.id || event.data?.eventId;
    const { buyerId, sellerId, transactionId, amount, currency } = event.data;

    return step.run('send-payment-completed-notification', async () => {
      return idempotencyService.executeIdempotent(
        { eventId, jobId: 'notify-payment-completed', eventName: event.name },
        async () => {
          const notifications = [];

          if (sellerId) {
            const sNotif = await notificationService.sendNotification(sellerId, {
              title: 'Payment Received into Escrow',
              message: `Payment of ${amount} ${currency || 'BDT'} confirmed and held in escrow for order #${transactionId}.`,
              type: 'TRANSACTION',
              data: { transactionId, amount },
            });
            notifications.push(sNotif);
          }

          if (buyerId) {
            const bNotif = await notificationService.sendNotification(buyerId, {
              title: 'Payment Confirmed',
              message: `Your payment for order #${transactionId} was confirmed. Asset transfer is in progress.`,
              type: 'TRANSACTION',
              data: { transactionId, amount },
            });
            notifications.push(bNotif);
          }

          return notifications;
        }
      );
    });
  }
);

/**
 * 6. Transfer Completed In-App Notification
 */
export const transferCompletedNotificationJob = inngest.createFunction(
  {
    id: 'notify-transfer-completed',
    name: 'Notification: Transfer Completed',
    retries: 3,
    idempotency: 'event.id',
    onFailure: async ({ error, event }) => {
      logger.error({ error: error.message, eventId: event.id }, 'Transfer completed notification failed');
    },
  },
  { event: EventNames.TRANSFER_COMPLETED },
  async ({ event, step }) => {
    const eventId = event.id || event.data?.eventId;
    const { fromUserId, toUserId, assetId, transferId } = event.data;

    return step.run('send-transfer-completed-notification', async () => {
      return idempotencyService.executeIdempotent(
        { eventId, jobId: 'notify-transfer-completed', eventName: event.name },
        async () => {
          const notifications = [];

          if (toUserId) {
            const bNotif = await notificationService.sendNotification(toUserId, {
              title: 'Asset Ownership Transferred',
              message: `Asset #${assetId} has been successfully transferred to your inventory.`,
              type: 'TRANSACTION',
              data: { assetId, transferId },
            });
            notifications.push(bNotif);
          }

          if (fromUserId) {
            const sNotif = await notificationService.sendNotification(fromUserId, {
              title: 'Asset Handover Finalized',
              message: `Transfer for asset #${assetId} is finalized. Escrow funds will be released to your balance.`,
              type: 'TRANSACTION',
              data: { assetId, transferId },
            });
            notifications.push(sNotif);
          }

          return notifications;
        }
      );
    });
  }
);

/**
 * 7. Fraud Detected In-App Notification
 */
export const fraudDetectedNotificationJob = inngest.createFunction(
  {
    id: 'notify-fraud-detected',
    name: 'Notification: Fraud Alert',
    retries: 3,
    idempotency: 'event.id',
    onFailure: async ({ error, event }) => {
      logger.error({ error: error.message, eventId: event.id }, 'Fraud notification failed');
    },
  },
  { event: EventNames.FRAUD_DETECTED },
  async ({ event, step }) => {
    const eventId = event.id || event.data?.eventId;
    const recipientId = event.data?.userId || event.user?.id;

    if (!recipientId) return { skipped: true, reason: 'No recipientId provided' };

    return step.run('send-fraud-notification', async () => {
      return idempotencyService.executeIdempotent(
        { eventId, jobId: 'notify-fraud-detected', eventName: event.name },
        async () => {
          return notificationService.sendNotification(recipientId, {
            title: 'Security Alert: Suspicious Activity Detected',
            message: `A security signal was detected (${event.data.riskLevel || 'HIGH'}). Our trust & safety team has been notified.`,
            type: 'SECURITY_ALERT',
            data: {
              targetId: event.data.targetId,
              riskLevel: event.data.riskLevel,
            },
          });
        }
      );
    });
  }
);

/**
 * 8. Report Created In-App Notification
 */
export const reportCreatedNotificationJob = inngest.createFunction(
  {
    id: 'notify-report-created',
    name: 'Notification: Report Created',
    retries: 3,
    idempotency: 'event.id',
    onFailure: async ({ error, event }) => {
      logger.error({ error: error.message, eventId: event.id }, 'Report created notification failed');
    },
  },
  { event: EventNames.REPORT_CREATED },
  async ({ event, step }) => {
    const eventId = event.id || event.data?.eventId;
    const reporterId = event.data?.reporterId || event.user?.id;

    if (!reporterId) return { skipped: true, reason: 'No reporterId provided' };

    return step.run('send-report-confirmation', async () => {
      return idempotencyService.executeIdempotent(
        { eventId, jobId: 'notify-report-created', eventName: event.name },
        async () => {
          return notificationService.sendNotification(reporterId, {
            title: 'Report Received',
            message: `Your report #${event.data.reportId} has been registered and is queued for compliance inspection.`,
            type: 'SYSTEM',
            data: { reportId: event.data.reportId, category: event.data.category },
          });
        }
      );
    });
  }
);

export const notificationJobs = [
  kycNotificationJob,
  assetVerifiedNotificationJob,
  listingReservedNotificationJob,
  transactionCreatedNotificationJob,
  paymentCompletedNotificationJob,
  transferCompletedNotificationJob,
  fraudDetectedNotificationJob,
  reportCreatedNotificationJob,
];
