import {
  AssetTypes,
  VerificationStatus,
  AssetStatus,
} from '../../common/constants/asset-types.constant.js';

/**
 * TransferPolicy
 *
 * Generic policy engine determining whether a particular asset type or provider
 * legally and architecturally permits asset transfer.
 *
 * Core Principles:
 * 1. Never assumes every asset is legally transferable.
 * 2. Railway tickets are legally non-transferable by default in transport jurisdictions
 *    (e.g., Bangladesh Railway / Indian Railways) and passenger identity is protected.
 * 3. Never permits modifying railway identity information directly unless an authorized
 *    external provider explicitly supports it.
 * 4. Extensible to support custom provider rules, event ticket pass transfers, and vouchers.
 */
export class TransferPolicy {
  /**
   * Default policy rules by asset type
   */
  static defaultPolicies = {
    [AssetTypes.RAILWAY_TICKET]: {
      legallyTransferable: false,
      requiresAuthorizedProvider: true,
      allowsDirectIdentityModification: false,
      description:
        'Railway tickets are non-transferable passenger records by transport regulations. Transfer requires an authorized official railway provider.',
    },
    [AssetTypes.BUS_TICKET]: {
      legallyTransferable: true,
      requiresAuthorizedProvider: false,
      allowsDirectIdentityModification: true,
      description:
        'Bus tickets are generally transferable subject to operator cancellation policies.',
    },
    [AssetTypes.EVENT_TICKET]: {
      legallyTransferable: true,
      requiresAuthorizedProvider: false,
      allowsDirectIdentityModification: true,
      description:
        'Event tickets and concert passes are legally transferable unless restricted by organizer.',
    },
    [AssetTypes.DOCUMENT]: {
      legallyTransferable: false,
      requiresAuthorizedProvider: true,
      allowsDirectIdentityModification: false,
      description:
        'Legal identity documents and government records cannot be transferred between individuals.',
    },
    [AssetTypes.OTHER]: {
      legallyTransferable: true,
      requiresAuthorizedProvider: false,
      allowsDirectIdentityModification: true,
      description: 'Generic digital assets and vouchers.',
    },
  };

  /**
   * Registry for custom policy overrides per assetType or provider
   */
  static customPolicies = new Map();

  /**
   * Register or override a transfer policy for an asset type
   * @param {string} assetType
   * @param {object} policyConfig
   */
  static registerPolicy(assetType, policyConfig) {
    this.customPolicies.set(assetType, {
      ...this.getPolicyForType(assetType),
      ...policyConfig,
    });
  }

  /**
   * Reset custom policies (useful for testing)
   */
  static resetPolicies() {
    this.customPolicies.clear();
  }

  /**
   * Retrieve active policy for an asset type
   * @param {string} assetType
   * @returns {object}
   */
  static getPolicyForType(assetType) {
    if (this.customPolicies.has(assetType)) {
      return this.customPolicies.get(assetType);
    }
    return this.defaultPolicies[assetType] || this.defaultPolicies[AssetTypes.OTHER];
  }

  /**
   * Check whether an asset is a railway ticket
   * @param {object} asset
   * @returns {boolean}
   */
  static isRailwayTicket(asset) {
    return asset?.assetType === AssetTypes.RAILWAY_TICKET;
  }

  /**
   * Determine if railway identity information can be modified.
   * "The system must never modify railway identity information directly unless an authorized
   * external provider explicitly supports it."
   *
   * @param {object} asset
   * @param {object} [provider]
   * @returns {boolean}
   */
  static allowsIdentityModification(asset, provider = null) {
    if (!this.isRailwayTicket(asset)) {
      // Non-railway assets allow attendee/ticket holder identity updates
      return true;
    }

    // For railway tickets, strictly verify provider authorization
    if (!provider) {
      return false;
    }

    // Must be an authorized provider with explicit identity modification support
    return Boolean(provider.isAuthorizedRailwayProvider && provider.supportsIdentityModification);
  }

  /**
   * Evaluate comprehensive transfer eligibility for an asset, provider, and parties
   *
   * @param {object} asset
   * @param {object} [context]
   * @param {object} [context.fromUser]
   * @param {object} [context.toUser]
   * @param {object} [context.provider]
   * @returns {{
   *   eligible: boolean,
   *   reason?: string,
   *   policyCode?: string,
   *   requiresAuthorizedProvider: boolean,
   *   supportsIdentityModification: boolean
   * }}
   */
  static evaluateEligibility(asset, context = {}) {
    const { fromUser, toUser, provider } = context;

    if (!asset) {
      return {
        eligible: false,
        reason: 'Asset does not exist',
        policyCode: 'ASSET_NOT_FOUND',
        requiresAuthorizedProvider: false,
        supportsIdentityModification: false,
      };
    }

    // 1. Check explicit asset non-transferability flag
    if (asset.isTransferable === false) {
      return {
        eligible: false,
        reason: 'Asset is explicitly designated as non-transferable',
        policyCode: 'ASSET_EXPLICITLY_NON_TRANSFERABLE',
        requiresAuthorizedProvider: false,
        supportsIdentityModification: false,
      };
    }

    // 2. Asset verification status requirement
    if (asset.verificationStatus !== VerificationStatus.VERIFIED) {
      return {
        eligible: false,
        reason: `Asset cannot be transferred in unverified status: ${asset.verificationStatus}`,
        policyCode: 'ASSET_NOT_VERIFIED',
        requiresAuthorizedProvider: false,
        supportsIdentityModification: false,
      };
    }

    // 3. Asset lifecycle status check
    const nonTransferableStatuses = [
      AssetStatus.TRANSFERRED,
      AssetStatus.CANCELLED,
      AssetStatus.REJECTED,
    ];
    if (nonTransferableStatuses.includes(asset.status)) {
      return {
        eligible: false,
        reason: `Asset cannot be transferred in status: ${asset.status}`,
        policyCode: 'INVALID_ASSET_STATUS',
        requiresAuthorizedProvider: false,
        supportsIdentityModification: false,
      };
    }

    // 4. Asset type policy check
    const policy = this.getPolicyForType(asset.assetType);

    if (!policy.legallyTransferable) {
      // If asset is not legally transferable by default (e.g. RAILWAY_TICKET or DOCUMENT),
      // it can ONLY be transferred if an authorized provider explicitly enables it
      const providerSupports =
        provider &&
        ((this.isRailwayTicket(asset) && provider.isAuthorizedRailwayProvider) ||
          (provider.supports && provider.supports(asset)));

      if (!providerSupports) {
        return {
          eligible: false,
          reason:
            policy.description ||
            `${asset.assetType} is not legally transferable under standard policy`,
          policyCode: 'LEGALLY_NON_TRANSFERABLE',
          requiresAuthorizedProvider: policy.requiresAuthorizedProvider,
          supportsIdentityModification: false,
        };
      }
    }

    // 5. User party validation (if users provided in context)
    if (fromUser && toUser) {
      const fromId = fromUser._id ? fromUser._id.toString() : fromUser.toString();
      const toId = toUser._id ? toUser._id.toString() : toUser.toString();

      if (fromId === toId) {
        return {
          eligible: false,
          reason: 'Cannot transfer asset to oneself',
          policyCode: 'SELF_TRANSFER_PROHIBITED',
          requiresAuthorizedProvider: policy.requiresAuthorizedProvider,
          supportsIdentityModification: false,
        };
      }

      if (fromUser.status === 'SUSPENDED' || toUser.status === 'SUSPENDED') {
        return {
          eligible: false,
          reason: 'Suspended users cannot participate in asset transfers',
          policyCode: 'USER_SUSPENDED',
          requiresAuthorizedProvider: policy.requiresAuthorizedProvider,
          supportsIdentityModification: false,
        };
      }
    }

    // 6. Check identity modification allowance
    const allowsIdMod = this.allowsIdentityModification(asset, provider);

    return {
      eligible: true,
      reason: 'Asset meets all transferability policies and requirements',
      policyCode: 'ELIGIBLE',
      requiresAuthorizedProvider: policy.requiresAuthorizedProvider,
      supportsIdentityModification: allowsIdMod,
    };
  }
}
