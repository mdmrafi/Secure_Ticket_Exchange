import { logger } from '../../config/logger.config.js';

export class EmailService {
  constructor() {
    this.outbox = [];
  }

  /**
   * Send a transactional email
   * @param {object} params
   * @param {string} params.to
   * @param {string} params.subject
   * @param {string} params.template
   * @param {object} params.data
   */
  async sendEmail({ to, subject, template, data = {} }) {
    const emailRecord = {
      id: `email_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      to,
      subject,
      template,
      data,
      sentAt: new Date(),
      status: 'SENT',
    };

    this.outbox.push(emailRecord);

    logger.info(
      { to, subject, template, emailId: emailRecord.id },
      'Email notifications background job: Transactional email dispatched'
    );

    return emailRecord;
  }

  /**
   * Helper: Send welcome email on user.created
   */
  async sendWelcomeEmail(user) {
    return this.sendEmail({
      to: user.email,
      subject: 'Welcome to Secure Ticket & Asset Exchange',
      template: 'USER_WELCOME',
      data: {
        name: user.name,
        email: user.email,
        userId: user.userId || user.id,
      },
    });
  }

  /**
   * Helper: Send KYC approval email
   */
  async sendKYCApprovedEmail({ email, name, kycId, verificationLevel }) {
    return this.sendEmail({
      to: email,
      subject: 'Identity Verification (KYC) Approved',
      template: 'KYC_APPROVED',
      data: { name, kycId, verificationLevel },
    });
  }

  /**
   * Helper: Send payment confirmation receipt
   */
  async sendPaymentReceiptEmail({ email, transactionId, amount, currency, transactionRef }) {
    return this.sendEmail({
      to: email,
      subject: `Payment Confirmed - Order #${transactionId}`,
      template: 'PAYMENT_RECEIPT',
      data: { transactionId, amount, currency, transactionRef },
    });
  }

  /**
   * Helper: Send transfer completed confirmation
   */
  async sendTransferCompletedEmail({ email, assetId, transferId, toUserName }) {
    return this.sendEmail({
      to: email,
      subject: `Asset Transfer Finalized - Asset #${assetId}`,
      template: 'TRANSFER_COMPLETED',
      data: { assetId, transferId, toUserName },
    });
  }

  /**
   * Helper: Send fraud / security alert
   */
  async sendFraudAlertEmail({ email, targetId, riskLevel, explanation }) {
    return this.sendEmail({
      to: email,
      subject: `[SECURITY ALERT] Suspicious Activity Detected (${riskLevel})`,
      template: 'FRAUD_ALERT',
      data: { targetId, riskLevel, explanation },
    });
  }

  /**
   * Helper: Send transaction initiated email
   */
  async sendTransactionInitiatedEmail({ email, transactionId, amount, currency }) {
    return this.sendEmail({
      to: email,
      subject: `Transaction Initiated - Order #${transactionId}`,
      template: 'TRANSACTION_INITIATED',
      data: { transactionId, amount, currency },
    });
  }

  /**
   * Helper: Send transaction payment reminder
   */
  async sendPaymentReminderEmail({ email, transactionId, amount, currency, expiresAt }) {
    return this.sendEmail({
      to: email,
      subject: `Reminder: Complete Payment for Order #${transactionId}`,
      template: 'TRANSACTION_REMINDER',
      data: { transactionId, amount, currency, expiresAt },
    });
  }

  /**
   * Retrieve sent emails in outbox
   */
  getOutbox() {
    return [...this.outbox];
  }

  /**
   * Clear outbox (useful for test resets)
   */
  clearOutbox() {
    this.outbox = [];
  }
}

export const emailService = new EmailService();
