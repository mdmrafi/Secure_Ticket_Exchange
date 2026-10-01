import { AssetMetadata } from './asset-metadata.interface.js';
import { AssetValidator } from './asset-validator.interface.js';
import { AssetVerifier } from './asset-verifier.interface.js';
import { TransferPolicy } from './transfer-policy.interface.js';
import { TransferProvider } from './transfer-provider.interface.js';

/**
 * Base AssetAdapter Interface
 *
 * Encapsulates the cohesive plugin contract for an Asset Type:
 * - AssetMetadata: specification, normalization, identifier generation
 * - AssetValidator: creation, listing, update validation
 * - AssetVerifier: multi-layer verification checks & fraud detection
 * - TransferPolicy: anti-scalping caps, transfer eligibility, KYC gates
 * - TransferProvider: ownership re-assignment & external provider integration
 */
export class AssetAdapter {
  /**
   * @param {object} config
   * @param {string} config.assetType
   * @param {string} config.displayName
   * @param {AssetMetadata} config.metadata
   * @param {AssetValidator} config.validator
   * @param {AssetVerifier} config.verifier
   * @param {TransferPolicy} config.transferPolicy
   * @param {TransferProvider} config.transferProvider
   */
  constructor({
    assetType,
    displayName,
    metadata,
    validator,
    verifier,
    transferPolicy,
    transferProvider,
  }) {
    if (!assetType) {
      throw new Error('AssetAdapter requires an assetType');
    }
    this.assetType = assetType;
    this.displayName = displayName || assetType;
    this.metadata = metadata;
    this.validator = validator;
    this.verifier = verifier;
    this.transferPolicy = transferPolicy;
    this.transferProvider = transferProvider;
  }

  /**
   * Convenience helper to normalize and validate asset data
   * @param {object} assetData
   */
  prepareAssetData(assetData = {}) {
    const normalizedMetadata = this.metadata
      ? this.metadata.normalize(assetData.metadata || {})
      : { ...(assetData.metadata || {}) };

    const uniqueAssetIdentifier =
      assetData.uniqueAssetIdentifier ||
      (this.metadata ? this.metadata.generateIdentifier(normalizedMetadata, assetData) : null);

    const title =
      assetData.title ||
      (this.metadata
        ? this.metadata.generateTitle(normalizedMetadata)
        : `${this.displayName} Asset`);

    const description =
      assetData.description ||
      (this.metadata ? this.metadata.generateSummary(normalizedMetadata) : '');

    return {
      ...assetData,
      assetType: this.assetType,
      title,
      description,
      uniqueAssetIdentifier,
      metadata: normalizedMetadata,
    };
  }

  /**
   * Validate asset data
   * @param {object} assetData
   */
  validateAsset(assetData) {
    if (this.validator) {
      return this.validator.validateAsset(assetData);
    }
    return { valid: true, errors: [] };
  }

  /**
   * Run verification
   * @param {object} asset
   * @param {object} [context={}]
   */
  async verify(asset, context = {}) {
    if (this.verifier) {
      return this.verifier.verify(asset, context);
    }
    return {
      isVerified: true,
      status: 'VERIFIED',
      confidenceScore: 100,
      checks: [],
      fraudFlags: [],
      details: {},
    };
  }

  /**
   * Check if listing can be created
   * @param {object} asset
   * @param {object} listingData
   * @param {object} seller
   */
  canList(asset, listingData, seller) {
    if (this.transferPolicy) {
      if (!this.transferPolicy.isTransferable(asset)) {
        return { allowed: false, reason: `${this.displayName} is non-transferable` };
      }
      const priceCheck = this.transferPolicy.validateListingPrice(
        asset,
        listingData.askingPrice || listingData.price
      );
      if (!priceCheck.allowed) {
        return { allowed: false, reason: priceCheck.reason };
      }
    }
    if (this.validator) {
      const val = this.validator.validateListing(asset, listingData, seller);
      if (!val.valid) {
        return { allowed: false, reason: val.errors.join(', ') };
      }
    }
    return { allowed: true };
  }

  /**
   * Check transfer eligibility
   * @param {object} asset
   * @param {object} fromUser
   * @param {object} toUser
   * @param {object} [context={}]
   */
  checkTransferEligibility(asset, fromUser, toUser, context = {}) {
    if (this.transferPolicy) {
      return this.transferPolicy.checkTransferEligibility(asset, fromUser, toUser, context);
    }
    return { eligible: true, reasons: [] };
  }

  /**
   * Execute transfer
   * @param {object} params - { asset, fromUser, toUser, options }
   */
  async executeTransfer(params = {}) {
    if (!this.transferProvider) {
      throw new Error(`No TransferProvider configured for asset type ${this.assetType}`);
    }
    const { asset, fromUser, toUser, options } = params;
    return this.transferProvider.transfer(asset, fromUser, toUser, options);
  }
}
