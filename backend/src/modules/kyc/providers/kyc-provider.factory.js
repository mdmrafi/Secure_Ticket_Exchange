import { MockKYCProvider } from './mock-kyc.provider.js';
import { FutureExternalKYCProvider } from './future-external-kyc.provider.js';
import { env } from '../../../config/env.config.js';
import { logger } from '../../../config/logger.config.js';

// Provider singletons
const mockProvider = new MockKYCProvider();
const futureExternalProvider = new FutureExternalKYCProvider();

const providerRegistry = new Map();
providerRegistry.set('mock', mockProvider);
providerRegistry.set('external', futureExternalProvider);
providerRegistry.set('future-external-kyc', futureExternalProvider);

/**
 * Register a custom KYC provider (e.g. PersonaKYCProvider, SumSubKYCProvider)
 * @param {string} name
 * @param {import('./kyc-provider.interface.js').KYCProvider} provider
 */
export const registerKYCProvider = (name, provider) => {
  providerRegistry.set(name.toLowerCase(), provider);
  logger.info({ providerName: name }, '[KYCProviderFactory] Registered custom KYC provider');
};

/**
 * Factory function to retrieve the configured KYC provider
 * @param {string} [providerName]
 * @returns {import('./kyc-provider.interface.js').KYCProvider}
 */
export const getKYCProvider = (providerName) => {
  const selectedName = (providerName || env.KYC_PROVIDER || 'mock').toLowerCase();
  const provider = providerRegistry.get(selectedName);

  if (!provider) {
    logger.warn(
      { requested: providerName, fallback: 'mock' },
      '[KYCProviderFactory] Provider not found, falling back to mock'
    );
    return mockProvider;
  }

  return provider;
};
