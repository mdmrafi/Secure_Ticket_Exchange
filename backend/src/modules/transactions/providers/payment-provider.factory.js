import { env } from '../../../config/env.config.js';
import { mockPaymentProvider } from './mock-payment.provider.js';

/**
 * Payment Provider Registry
 * Allows plugging in real payment providers (e.g. Stripe, SSLCommerz, bKash, PayPal)
 */
const providerRegistry = new Map([['mock', mockPaymentProvider]]);

/**
 * Register a new payment provider adapter
 * @param {string} name - Provider identifier
 * @param {import('./payment-provider.interface.js').PaymentProvider} providerInstance
 */
export function registerPaymentProvider(name, providerInstance) {
  providerRegistry.set(name.toLowerCase(), providerInstance);
}

/**
 * Retrieve the active or requested payment provider instance
 *
 * @param {string} [requestedProvider]
 * @returns {import('./payment-provider.interface.js').PaymentProvider}
 */
export function getPaymentProvider(requestedProvider) {
  const providerKey = (requestedProvider || env.PAYMENT_PROVIDER || 'mock').toLowerCase();
  const provider = providerRegistry.get(providerKey);

  if (!provider) {
    // Fall back to mock provider with a warning rather than crashing in dev/test
    return mockPaymentProvider;
  }

  return provider;
}
