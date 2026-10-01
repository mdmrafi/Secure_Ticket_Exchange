import { inngest } from '../../config/inngest.config.js';
import { EventNames } from '../../common/constants/events.constant.js';
import { Transaction } from '../../modules/transactions/transaction.model.js';
import { TransactionStatus, PaymentStatus } from '../../common/constants/asset-types.constant.js';
import { notificationService } from '../../modules/notifications/notification.service.js';
import { emailService } from '../../modules/notifications/email.service.js';
import { idempotencyService } from '../idempotency/idempotency.service.js';
import { logger } from '../../config/logger.config.js';

/**
 * Background job: Transaction payment reminders
 * Waits for a configurable reminder window, then checks if payment is still pending.
 * If pending, dispatches both in-app and email reminders to the buyer.
 */
export const transactionRemindersJob = inngest.createFunction(
  {
    id: 'transaction-reminders-job',
    name: 'Transaction: Pending Payment Reminder',
    retries: 3,
    idempotency: 'event.id',
    onFailure: async ({ error, event }) => {
      logger.error(
        { error: error.message, eventId: event.id },
        'Transaction reminder job permanently failed'
      );
    },
  },
  { event: EventNames.TRANSACTION_CREATED },
  async ({ event, step }) => {
    const { transactionId, delay = '10m' } = event.data;
    const eventId = event.id || event.data?.eventId;

    if (!transactionId) {
      return { skipped: true, reason: 'No transactionId provided' };
    }

    // Step 1: Wait for reminder duration (e.g. 10m in production, or custom duration in tests)
    if (delay && delay !== '0s') {
      await step.sleep('wait-for-payment-reminder-window', delay);
    }

    // Step 2: Idempotent status check and reminder delivery
    return step.run('check-transaction-and-send-reminder', async () => {
      return idempotencyService.executeIdempotent(
        {
          eventId,
          jobId: 'transaction-reminders-job',
          eventName: event.name,
        },
        async () => {
          const tx = await Transaction.findById(transactionId).populate('buyerId sellerId');
          if (!tx) {
            return { sent: false, reason: 'Transaction not found' };
          }

          // Check if still in pending/unpaid state
          const isPending =
            tx.transactionStatus === TransactionStatus.INITIATED ||
            tx.transactionStatus === TransactionStatus.PAYMENT_PENDING ||
            tx.paymentStatus === PaymentStatus.PENDING;

          if (!isPending) {
            logger.info(
              { transactionId, status: tx.transactionStatus },
              'Transaction reminder skipped: payment has already been completed or cancelled'
            );
            return {
              sent: false,
              reason: `Transaction already in status ${tx.transactionStatus}`,
            };
          }

          // Check if reminder was already sent
          if (tx.metadata?.paymentReminderSentAt) {
            return {
              sent: false,
              reason: 'Reminder was already dispatched for this transaction',
            };
          }

          const buyer = tx.buyerId;
          const buyerId = buyer?._id || buyer;
          const buyerEmail = buyer?.email || event.data?.buyerEmail;

          logger.info({ transactionId, buyerId }, 'Dispatching transaction payment reminder');

          // Send in-app notification
          if (buyerId) {
            await notificationService.sendNotification(buyerId, {
              title: 'Reminder: Action Required for Order',
              message: `Your payment for order #${transactionId} (${tx.amount} ${tx.currency}) is still pending. Please finalize to secure your ticket.`,
              type: 'TRANSACTION',
              data: { transactionId: tx._id, amount: tx.amount },
            });
          }

          // Send reminder email
          if (buyerEmail) {
            await emailService.sendPaymentReminderEmail({
              email: buyerEmail,
              transactionId: tx._id,
              amount: tx.amount,
              currency: tx.currency,
              expiresAt: tx.expiresAt,
            });
          }

          // Record reminder timestamp in transaction metadata
          await Transaction.findByIdAndUpdate(tx._id, {
            $set: { 'metadata.paymentReminderSentAt': new Date() },
          });

          return {
            sent: true,
            transactionId: tx._id,
            remindedAt: new Date(),
          };
        }
      );
    });
  }
);

export const reminderJobs = [transactionRemindersJob];
