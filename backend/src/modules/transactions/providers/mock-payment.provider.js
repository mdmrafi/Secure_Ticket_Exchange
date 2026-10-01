import crypto from 'crypto';
import { PaymentProvider } from './payment-provider.interface.js';
import { env } from '../../../config/env.config.js';

/**
 * Mock Payment Provider
 *
 * Implements PaymentProvider contract.
 * Simulates third-party payment gateway integration (Stripe / SSLCommerz / bKash).
 * Maintains an internal authoritative session store and supports HMAC-SHA256 webhook signatures.
 */
export class MockPaymentProvider extends PaymentProvider {
  constructor(webhookSecret = env.PAYMENT_WEBHOOK_SECRET) {
    super();
    this.name = 'mock-payment-gateway';
    this.webhookSecret = webhookSecret || 'mock_payment_webhook_secret_key_32_bytes_min_exchange';
    // Authoritative in-memory gateway ledger
    this.sessions = new Map();
  }

  get providerName() {
    return this.name;
  }

  /**
   * Reset in-memory session registry (useful in tests)
   */
  resetRegistry() {
    this.sessions.clear();
  }

  /**
   * Helper to compute HMAC-SHA256 signature for webhook payload
   * @param {string|object} payload
   * @returns {string} hex signature
   */
  computeHmac(payload) {
    let payloadStr;
    if (typeof payload === 'string') {
      payloadStr = payload;
    } else if (payload && typeof payload === 'object') {
      // Deterministically sort keys for canonical JSON serialization across processes
      payloadStr = JSON.stringify(payload, Object.keys(payload).sort());
    } else {
      payloadStr = String(payload);
    }
    return crypto.createHmac('sha256', this.webhookSecret).update(payloadStr).digest('hex');
  }

  /**
   * Helper to timing-safely verify HMAC signature
   * @param {string} signature
   * @param {string|object} payload
   * @returns {boolean}
   */
  verifySignature(signature, payload) {
    if (!signature) return false;
    try {
      const expected = this.computeHmac(payload);
      const sigBuf = Buffer.from(signature, 'hex');
      const expBuf = Buffer.from(expected, 'hex');
      if (sigBuf.length !== expBuf.length) return false;
      return crypto.timingSafeEqual(sigBuf, expBuf);
    } catch {
      return false;
    }
  }

  /**
   * Create an initial checkout session with the payment gateway
   *
   * @param {{ transactionId: string, amount: number, currency: string, buyerId: string, buyerEmail?: string, metadata?: object }} param0
   */
  async createPayment({ transactionId, amount, currency, buyerId, buyerEmail, metadata = {} }) {
    if (!transactionId) {
      throw new Error('Transaction ID is required to create a payment session');
    }
    if (typeof amount !== 'number' || amount <= 0) {
      throw new Error('Payment amount must be a positive number');
    }

    const curr = (currency || 'BDT').toUpperCase();
    const paymentSessionId = `mock_sess_${transactionId}_${crypto.randomBytes(6).toString('hex')}`;
    const checkoutUrl = `https://checkout.mockpay.test/pay/${paymentSessionId}`;

    const sessionRecord = {
      provider: this.name,
      paymentSessionId,
      transactionId: String(transactionId),
      buyerId: String(buyerId),
      buyerEmail: buyerEmail || null,
      amount,
      currency: curr,
      status: 'PENDING',
      createdAt: new Date(),
      paidAt: null,
      transactionRef: null,
      failureReason: null,
      metadata,
    };

    // Store in authoritative gateway registry
    this.sessions.set(paymentSessionId, sessionRecord);

    return {
      provider: this.name,
      paymentSessionId,
      checkoutUrl,
      amount,
      currency: curr,
      status: 'PENDING',
      createdAt: sessionRecord.createdAt,
    };
  }

  /**
   * Backward-compatible alias for createPayment
   */
  async createPaymentSession(data) {
    return this.createPayment(data);
  }

  /**
   * Authoritatively verify payment status with gateway.
   * NEVER trusts client assertions; checks the provider registry directly.
   *
   * @param {{ paymentSessionId: string, transactionRef?: string, signature?: string, payload?: object, headers?: object }} param0
   */
  async verifyPayment({
    paymentSessionId,
    transactionRef = null,
    signature = null,
    payload = null,
    headers = {},
  }) {
    if (!paymentSessionId) {
      return {
        provider: this.name,
        paymentSessionId: null,
        status: 'FAILED',
        failureReason: 'Missing paymentSessionId for verification',
      };
    }

    const session = this.sessions.get(paymentSessionId);
    if (!session) {
      return {
        provider: this.name,
        paymentSessionId,
        status: 'FAILED',
        failureReason: `Payment session '${paymentSessionId}' does not exist on gateway`,
      };
    }

    // Verify webhook signature if provided
    let isSignatureValid = true;
    const providedSig = signature || headers['x-signature'] || headers['x-webhook-signature'];
    if (providedSig && payload) {
      isSignatureValid = this.verifySignature(providedSig, payload);
    }

    return {
      provider: this.name,
      paymentSessionId: session.paymentSessionId,
      transactionId: session.transactionId,
      transactionRef: session.transactionRef || transactionRef || null,
      status: session.status,
      amount: session.amount,
      currency: session.currency,
      paidAt: session.paidAt,
      failureReason: session.failureReason,
      isSignatureValid,
      rawResponse: { ...session },
    };
  }

  /**
   * Refund an existing payment on gateway
   *
   * @param {{ paymentSessionId: string, amount: number, currency?: string, reason?: string }} param0
   */
  async refundPayment({ paymentSessionId, amount, currency = 'BDT', reason = 'Transaction cancelled' }) {
    const session = this.sessions.get(paymentSessionId);
    const refundId = `MOCK-REF-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const refundedAt = new Date();

    if (session) {
      session.status = 'REFUNDED';
      session.refundedAt = refundedAt;
      session.refundReason = reason;
    }

    return {
      provider: this.name,
      refundId,
      paymentSessionId,
      amount,
      currency: (currency || session?.currency || 'BDT').toUpperCase(),
      status: 'REFUNDED',
      refundedAt,
      reason,
    };
  }

  /**
   * Helper for tests & simulations: Simulate customer action at checkout page
   * Updates the provider's authoritative ledger to PAID or FAILED.
   *
   * @param {{ paymentSessionId: string, outcome?: 'SUCCESS' | 'FAIL', failureReason?: string, transactionRef?: string }} param0
   */
  async simulateCustomerPayment({
    paymentSessionId,
    outcome = 'SUCCESS',
    failureReason = null,
    transactionRef = null,
  }) {
    let session = this.sessions.get(paymentSessionId);
    if (!session) {
      // Create lazy session if not previously stored (backward-compatibility for tests)
      session = {
        provider: this.name,
        paymentSessionId,
        transactionId: null,
        amount: 0,
        currency: 'BDT',
        status: 'PENDING',
        createdAt: new Date(),
      };
      this.sessions.set(paymentSessionId, session);
    }

    const ref =
      transactionRef ||
      session.transactionRef ||
      `MOCK-TX-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    if (outcome === 'SUCCESS') {
      session.status = 'PAID';
      session.paidAt = new Date();
      session.transactionRef = ref;
      session.failureReason = null;
    } else {
      session.status = 'FAILED';
      session.paidAt = null;
      session.transactionRef = ref;
      session.failureReason = failureReason || 'Card declined or insufficient balance in payment source';
    }

    return {
      provider: this.name,
      paymentSessionId,
      transactionRef: session.transactionRef,
      status: session.status,
      paidAt: session.paidAt,
      failureReason: session.failureReason,
    };
  }

  /**
   * Backward-compatible alias for processPayment
   */
  async processPayment(params) {
    return this.simulateCustomerPayment(params);
  }

  /**
   * Helper to generate a signed webhook payload from gateway
   *
   * @param {object} options
   */
  generateSignedWebhookPayload(options = {}) {
    const {
      paymentSessionId,
      transactionId,
      outcome = 'SUCCESS',
      amount,
      currency = 'BDT',
      timestamp = Date.now(),
      transactionRef = `MOCK-TX-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
      failureReason = null,
    } = options;

    const payload = {
      event: outcome === 'SUCCESS' ? 'payment.succeeded' : 'payment.failed',
      status: outcome === 'SUCCESS' ? 'PAID' : 'FAILED',
      outcome,
      paymentSessionId,
      transactionId,
      transactionRef,
      amount,
      currency: currency.toUpperCase(),
      timestamp,
      failureReason: outcome === 'SUCCESS' ? null : (failureReason || 'Payment failed'),
    };

    const signature = this.computeHmac(payload);

    return {
      payload,
      signature,
      headers: {
        'x-signature': signature,
        'x-webhook-timestamp': String(timestamp),
        'Content-Type': 'application/json',
      },
    };
  }
}

export const mockPaymentProvider = new MockPaymentProvider();
