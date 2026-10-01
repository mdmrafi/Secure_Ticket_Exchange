/**
 * AssetValidator Interface
 *
 * Validates domain integrity at creation, updates, and marketplace listing boundaries.
 */
export class AssetValidator {
  /**
   * @param {string} assetType
   */
  constructor(assetType) {
    if (new.target === AssetValidator) {
      throw new TypeError('Cannot construct AssetValidator directly; subclass required');
    }
    this.assetType = assetType;
  }

  /**
   * Validate asset data payload at creation/ingestion time
   * @param {object} assetData - { title, originalValue, currency, metadata, ... }
   * @returns {{ valid: boolean, errors: string[] }}
   */
  validateAsset(assetData = {}) {
    throw new Error('validateAsset() must be implemented by subclass');
  }

  /**
   * Validate marketplace listing payload
   * @param {object} asset - Current asset document
   * @param {object} listingData - { askingPrice, expiresAt, notes, ... }
   * @param {object} seller - Seller user document
   * @returns {{ valid: boolean, errors: string[] }}
   */
  validateListing(asset, listingData = {}, seller = {}) {
    return { valid: true, errors: [] };
  }

  /**
   * Validate updates to an existing asset or listing
   * @param {object} currentRecord
   * @param {object} updateData
   * @param {string} [userRole='USER']
   * @returns {{ valid: boolean, errors: string[] }}
   */
  validateUpdate(currentRecord, updateData = {}, userRole = 'USER') {
    return { valid: true, errors: [] };
  }
}
