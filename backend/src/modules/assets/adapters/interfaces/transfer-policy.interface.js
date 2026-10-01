/**
 * TransferPolicy Interface
 *
 * Defines legal, commercial, and operational transferability constraints for an asset type.
 * Enforces anti-scalping price caps, KYC requirements, transfer windows, and immutability rules.
 */
export class TransferPolicy {
  /**
   * @param {string} assetType
   */
  constructor(assetType) {
    if (new.target === TransferPolicy) {
      throw new TypeError('Cannot construct TransferPolicy directly; subclass required');
    }
    this.assetType = assetType;
  }

  /**
   * Whether this asset type is legally/technically transferable by default
   * @param {object} [asset]
   * @returns {boolean}
   */
  isTransferable(asset) {
    return true;
  }

  /**
   * Whether transfers require an official authorized external provider
   * @param {object} [asset]
   * @returns {boolean}
   */
  requiresAuthorizedProvider(asset) {
    return false;
  }

  /**
   * Whether passenger/holder identity fields can be directly modified without provider re-issuance
   * @param {object} [asset]
   * @returns {boolean}
   */
  allowsDirectIdentityModification(asset) {
    return true;
  }

  /**
   * Enforce anti-scalping price caps and maximum allowed markup
   * @param {object} asset
   * @param {number} askingPrice
   * @returns {{ allowed: boolean, reason?: string, maxAllowedPrice: number }}
   */
  validateListingPrice(asset, askingPrice) {
    const originalValue = asset.originalValue || 0;
    return {
      allowed: true,
      maxAllowedPrice: originalValue > 0 ? originalValue * 1.5 : askingPrice,
    };
  }

  /**
   * Check if seller must complete KYC verification before listing this asset
   * @param {object} asset
   * @param {number} askingPrice
   * @param {object} [seller]
   * @returns {boolean}
   */
  isKycRequired(asset, askingPrice, seller = {}) {
    return askingPrice >= 5000;
  }

  /**
   * Check eligibility for executing a transfer between fromUser and toUser
   * @param {object} asset
   * @param {object} fromUser
   * @param {object} toUser
   * @param {object} [context={}]
   * @returns {{ eligible: boolean, reasons: string[] }}
   */
  checkTransferEligibility(asset, fromUser, toUser, context = {}) {
    const reasons = [];
    if (!this.isTransferable(asset)) {
      reasons.push(`${this.assetType} is marked non-transferable by policy`);
    }
    return {
      eligible: reasons.length === 0,
      reasons,
    };
  }

  /**
   * Return protected identity fields that sellers cannot modify in marketplace listings
   * @returns {string[]}
   */
  getProtectedFields() {
    return [
      'assetId',
      'sellerId',
      'uniqueAssetIdentifier',
      'originalValue',
      'currency',
      'metadata',
      'documents',
    ];
  }
}
