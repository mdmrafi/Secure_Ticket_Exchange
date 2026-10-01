import crypto from 'crypto';

/**
 * Mock Payment Provider
 * Simulates third-party payment gateway integration (Stripe / SSLCommerz / bKash).
 */
export class MockPaymentProvider {
  constructor() {
    this.name = 'mock-payment-gateway';
  }

  /**
   * Create an initial checkout session
   * @param {{ transactionId: string, amount: number, currency: string, buyerId: string }} param0
   */
  async createPaymentSession({ transactionId, amount, currency, buyerId }) {
    const paymentSessionId = `mock_sess_${transactionId}_${crypto.randomBytes(6).toString('hex')}`;
    return {
      provider: this.name,
      paymentSessionId,
      checkoutUrl: `https://checkout.mockpay.test/pay/${paymentSessionId}`,
      amount,
      currency,
      status: 'PENDING',
      createdAt: new Date(),
    };
  }

  /**
   * Process a simulated payment attempt
   * @param {{ paymentSessionId: string, outcome?: 'SUCCESS' | 'FAIL', failureReason?: string, transactionRef?: string }} param0
   */
  async processPayment({
    paymentSessionId,
    outcome = 'SUCCESS',
    failureReason = null,
    transactionRef = null,
  }) {
    const isSuccess = outcome === 'SUCCESS';
    const ref =
      transactionRef ||
      `MOCK-TX-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    if (isSuccess) {
      return {
        provider: this.name,
        paymentSessionId,
        transactionRef: ref,
        status: 'PAID',
        paidAt: new Date(),
        failureReason: null,
      };
    }

    return {
      provider: this.name,
      paymentSessionId,
      transactionRef: ref,
      status: 'FAILED',
      paidAt: null,
      failureReason: failureReason || 'Card declined or insufficient balance in payment source',
    };
  }

  /**
   * Refund an existing payment
   * @param {{ paymentSessionId: string, amount: number, reason?: string }} param0
   */
  async refundPayment({ paymentSessionId, amount, reason = 'Transaction cancelled' }) {
    return {
      provider: this.name,
      refundId: `MOCK-REF-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
      paymentSessionId,
      amount,
      status: 'REFUNDED',
      refundedAt: new Date(),
      reason,
    };
  }
}

export const mockPaymentProvider = new MockPaymentProvider();
