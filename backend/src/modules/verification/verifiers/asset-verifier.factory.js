import { RailwayTicketVerifier } from './railway-ticket.verifier.js';
import { AssetTypes, VerificationStatus } from '../../../common/constants/asset-types.constant.js';
import { logger } from '../../../config/logger.config.js';
import { getAssetAdapter, hasAssetAdapter } from '../../assets/adapters/index.js';

// Verifier registry
const verifierRegistry = new Map();
verifierRegistry.set(AssetTypes.RAILWAY_TICKET, new RailwayTicketVerifier());

/**
 * Register a custom asset verifier
 * @param {string} assetType
 * @param {import('./asset-verifier.interface.js').AssetVerifier} verifier
 */
export const registerAssetVerifier = (assetType, verifier) => {
  verifierRegistry.set(assetType, verifier);
  logger.info({ assetType }, '[AssetVerifierFactory] Registered custom asset verifier');
};

/**
 * Factory function to retrieve the appropriate AssetVerifier for an assetType
 * @param {string} assetType
 * @returns {import('./asset-verifier.interface.js').AssetVerifier}
 */
export const getAssetVerifier = (assetType) => {
  const verifier = verifierRegistry.get(assetType);

  if (verifier) {
    return verifier;
  }

  if (hasAssetAdapter(assetType)) {
    const adapter = getAssetAdapter(assetType);
    if (adapter.verifier) {
      return adapter.verifier;
    }
  }

  logger.warn(
    { assetType },
    '[AssetVerifierFactory] No specific verifier found, using fallback generic stub verifier'
  );

  // Return a generic fallback stub verifier for future asset types
  return {
    getAssetType: () => assetType,
    async verify(asset) {
      return {
        isVerified: false,
        status: VerificationStatus.IN_REVIEW,
        confidenceScore: 0,
        checks: [
          {
            checkType: `${assetType}_STUB_CHECK`,
            status: 'PENDING',
            details: { message: `Stub verifier for ${assetType}` },
            performedAt: new Date(),
          },
        ],
        fraudFlags: [],
        details: {
          assetType,
          stubMode: true,
          message: `Verification logic for ${assetType} will be integrated later.`,
        },
      };
    },
  };
};
