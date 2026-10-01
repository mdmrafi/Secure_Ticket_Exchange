/**
 * PaymentProvider Interface / Abstract Base Class
 *
 * Defines the contract that all payment provider adapters (Mock, Stripe, SSLCommerz, bKash, etc.)
 * must implement to ensure seamless pluggability and standardized payment operations.
 */
export class PaymentProvider {
  /**
   * Provider identifier (e.g. 'mock-payment-gateway', 'stripe', 'sslcommerz')
   * @type {string}
   */
  get providerName() {
    throw new Error("Getter 'providerName' must be implemented by payment provider subclass.");
  }

  /**
   * Create an initial checkout session with the payment gateway
   *
   * @param {object} paymentData
   * @param {string} paymentData.transactionId - Internal database transaction ID
   * @param {number} paymentData.amount - Payment amount (must be positive)
   * @param {string} paymentData.currency - ISO 4217 Currency code (e.g. 'BDT', 'USD')
   * @param {string} paymentData.buyerId - ID of the buyer initiating payment
   * @param {string} [paymentData.buyerEmail] - Buyer email address for notifications
   * @param {object} [paymentData.metadata] - Optional arbitrary context data
   * @returns {Promise<{
   *   provider: string,
   *   paymentSessionId: string,
   *   checkoutUrl: string,
   *   clientSecret?: string,
   *   amount: number,
   *   currency: string,
   *   status: 'PENDING',
   *   createdAt: Date
   * }>}
   */
  async createPayment(paymentData) {
    throw new Error("Method 'createPayment()' must be implemented by payment provider subclass.");
  }

  /**
   * Query or verify the authoritative status of a payment session directly from the provider.
   * NEVER trust client-supplied payment success; the backend must verify through this method.
   *
   * @param {object} verificationData
   * @param {string} verificationData.paymentSessionId - Unique provider session identifier
   * @param {string} [verificationData.transactionRef] - Gateway reference number if available
   * @param {string} [verificationData.signature] - Webhook HMAC signature if verifying webhook
   * @param {object} [verificationData.payload] - Raw payload received from gateway
   * @param {object} [verificationData.headers] - Raw request headers from gateway webhook
   * @returns {Promise<{
   *   provider: string,
   *   paymentSessionId: string,
   *   transactionRef: string,
   *   transactionId?: string,
   *   status: 'PAID' | 'FAILED' | 'PENDING',
   *   amount: number,
   *   currency: string,
   *   paidAt?: Date,
   *   failureReason?: string,
   *   isSignatureValid?: boolean,
   *   rawResponse?: object
   * }>}
   */
  async verifyPayment(verificationData) {
    throw new Error("Method 'verifyPayment()' must be implemented by payment provider subclass.");
  }

  /**
   * Execute a full or partial refund of a confirmed payment
   *
   * @param {object} refundData
   * @param {string} refundData.paymentSessionId - Unique provider session identifier
   * @param {string} [refundData.transactionRef] - Gateway reference number
   * @param {number} refundData.amount - Amount to refund
   * @param {string} [refundData.currency] - Currency code
   * @param {string} [refundData.reason] - Explanation for refund
   * @returns {Promise<{
   *   provider: string,
   *   refundId: string,
   *   paymentSessionId: string,
   *   amount: number,
   *   currency: string,
   *   status: 'REFUNDED',
   *   refundedAt: Date,
   *   reason?: string
   * }>}
   */
  async refundPayment(refundData) {
    throw new Error("Method 'refundPayment()' must be implemented by payment provider subclass.");
  }
}
