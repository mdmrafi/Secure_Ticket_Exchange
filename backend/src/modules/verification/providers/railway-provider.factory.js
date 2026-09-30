import { MockRailwayVerificationProvider } from './mock-railway.provider.js';
import { FutureOfficialRailwayAPIProvider } from './future-official-railway.provider.js';
import { logger } from '../../../config/logger.config.js';

const mockProvider = new MockRailwayVerificationProvider();
const officialProvider = new FutureOfficialRailwayAPIProvider();

const providerRegistry = new Map();
providerRegistry.set('mock', mockProvider);
providerRegistry.set('official', officialProvider);
providerRegistry.set('default', mockProvider);

/**
 * Register a custom railway verification provider
 * @param {string} name
 * @param {import('./railway-provider.interface.js').RailwayVerificationProvider} provider
 */
export const registerRailwayVerificationProvider = (name, provider) => {
  providerRegistry.set(name.toLowerCase(), provider);
  logger.info({ providerName: name }, '[RailwayProviderFactory] Registered custom railway provider');
};

/**
 * Factory function to retrieve configured RailwayVerificationProvider
 * @param {string} [name]
 * @returns {import('./railway-provider.interface.js').RailwayVerificationProvider}
 */
export const getRailwayVerificationProvider = (name = 'mock') => {
  const selectedName = (name || process.env.RAILWAY_PROVIDER || 'mock').toLowerCase();
  const provider = providerRegistry.get(selectedName);

  if (!provider) {
    logger.warn({ requested: name, fallback: 'mock' }, '[RailwayProviderFactory] Falling back to mock');
    return mockProvider;
  }

  return provider;
};
