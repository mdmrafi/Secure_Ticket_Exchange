import { inngest } from '../../config/inngest.config.js';
import { EventNames } from '../../common/constants/events.constant.js';
import { emailService } from '../../modules/notifications/email.service.js';
import { idempotencyService } from '../idempotency/idempotency.service.js';
import { logger } from '../../config/logger.config.js';

/**
 * 1. User Welcome Email Job
 */
export const userCreatedEmailJob = inngest.createFunction(
  {
    id: 'email-user-created',
    name: 'Email: User Welcome',
    retries: 3,
    idempotency: 'event.id',
    onFailure: async ({ error, event }) => {
      logger.error({ error: error.message, eventId: event.id }, 'Failed to send welcome email');
    },
  },
  { event: EventNames.USER_CREATED },
  async ({ event, step }) => {
    const eventId = event.id || event.data?.eventId;

    return step.run('send-welcome-email', async () => {
      return idempotencyService.executeIdempotent(
        { eventId, jobId: 'email-user-created', eventName: event.name },
        async () => {
          return emailService.sendWelcomeEmail({
            email: event.data.email,
            name: event.data.name,
            userId: event.data.userId || event.data.id,
          });
        }
      );
    });
  }
);

/**
 * 2. KYC Approval Email Job
 */
export const kycCompletedEmailJob = inngest.createFunction(
  {
    id: 'email-kyc-completed',
    name: 'Email: KYC Completed',
    retries: 3,
    idempotency: 'event.id',
    onFailure: async ({ error, event }) => {
      logger.error(
        { error: error.message, eventId: event.id },
        'Failed to send KYC approval email'
      );
    },
  },
  { event: EventNames.KYC_COMPLETED },
  async ({ event, step }) => {
    const eventId = event.id || event.data?.eventId;

    return step.run('send-kyc-email', async () => {
      return idempotencyService.executeIdempotent(
        { eventId, jobId: 'email-kyc-completed', eventName: event.name },
        async () => {
          return emailService.sendKYCApprovedEmail({
            email: event.data.email || event.user?.email,
            name: event.data.name || 'User',
            kycId: event.data.kycId,
            verificationLevel: event.data.verificationLevel,
          });
        }
      );
    });
  }
);

/**
 * 3. Transaction Initiated Email Job
 */
export const transactionCreatedEmailJob = inngest.createFunction(
  {
    id: 'email-transaction-created',
    name: 'Email: Transaction Initiated',
    retries: 3,
    idempotency: 'event.id',
    onFailure: async ({ error, event }) => {
      logger.error(
        { error: error.message, eventId: event.id },
        'Failed to send transaction initiated email'
      );
    },
  },
  { event: EventNames.TRANSACTION_CREATED },
  async ({ event, step }) => {
    const eventId = event.id || event.data?.eventId;

    return step.run('send-transaction-email', async () => {
      return idempotencyService.executeIdempotent(
        { eventId, jobId: 'email-transaction-created', eventName: event.name },
        async () => {
          return emailService.sendTransactionInitiatedEmail({
            email: event.data.buyerEmail || event.user?.email,
            transactionId: event.data.transactionId,
            amount: event.data.amount,
            currency: event.data.currency || 'BDT',
          });
        }
      );
    });
  }
);

/**
 * 4. Payment Completed Email Job
 */
export const paymentCompletedEmailJob = inngest.createFunction(
  {
    id: 'email-payment-completed',
    name: 'Email: Payment Receipt',
    retries: 3,
    idempotency: 'event.id',
    onFailure: async ({ error, event }) => {
      logger.error(
        { error: error.message, eventId: event.id },
        'Failed to send payment receipt email'
      );
    },
  },
  { event: EventNames.PAYMENT_COMPLETED },
  async ({ event, step }) => {
    const eventId = event.id || event.data?.eventId;

    return step.run('send-payment-receipt', async () => {
      return idempotencyService.executeIdempotent(
        { eventId, jobId: 'email-payment-completed', eventName: event.name },
        async () => {
          return emailService.sendPaymentReceiptEmail({
            email: event.data.buyerEmail || event.user?.email,
            transactionId: event.data.transactionId,
            amount: event.data.amount,
            currency: event.data.currency || 'BDT',
            transactionRef: event.data.transactionRef,
          });
        }
      );
    });
  }
);

/**
 * 5. Transfer Completed Email Job
 */
export const transferCompletedEmailJob = inngest.createFunction(
  {
    id: 'email-transfer-completed',
    name: 'Email: Transfer Delivery',
    retries: 3,
    idempotency: 'event.id',
    onFailure: async ({ error, event }) => {
      logger.error(
        { error: error.message, eventId: event.id },
        'Failed to send transfer delivery email'
      );
    },
  },
  { event: EventNames.TRANSFER_COMPLETED },
  async ({ event, step }) => {
    const eventId = event.id || event.data?.eventId;

    return step.run('send-transfer-email', async () => {
      return idempotencyService.executeIdempotent(
        { eventId, jobId: 'email-transfer-completed', eventName: event.name },
        async () => {
          return emailService.sendTransferCompletedEmail({
            email: event.data.toUserEmail || event.user?.email,
            assetId: event.data.assetId,
            transferId: event.data.transferId,
            toUserName: event.data.toUserName,
          });
        }
      );
    });
  }
);

/**
 * 6. Fraud Alert Email Job
 */
export const fraudAlertEmailJob = inngest.createFunction(
  {
    id: 'email-fraud-detected',
    name: 'Email: Fraud Alert',
    retries: 3,
    idempotency: 'event.id',
    onFailure: async ({ error, event }) => {
      logger.error({ error: error.message, eventId: event.id }, 'Failed to send fraud alert email');
    },
  },
  { event: EventNames.FRAUD_DETECTED },
  async ({ event, step }) => {
    const eventId = event.id || event.data?.eventId;

    return step.run('send-fraud-alert', async () => {
      return idempotencyService.executeIdempotent(
        { eventId, jobId: 'email-fraud-detected', eventName: event.name },
        async () => {
          return emailService.sendFraudAlertEmail({
            email: event.data.userEmail || event.user?.email,
            targetId: event.data.targetId,
            riskLevel: event.data.riskLevel,
            explanation:
              event.data.summaryExplanation ||
              'Suspicious signals detected during automated risk evaluation.',
          });
        }
      );
    });
  }
);

export const emailJobs = [
  userCreatedEmailJob,
  kycCompletedEmailJob,
  transactionCreatedEmailJob,
  paymentCompletedEmailJob,
  transferCompletedEmailJob,
  fraudAlertEmailJob,
];
