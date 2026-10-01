/**
 * AssetMetadata Interface
 *
 * Defines metadata specification, extraction normalization, identifier generation,
 * and presentation titles for a specific asset type.
 */
export class AssetMetadata {
  /**
   * @param {string} assetType - Unique identifier of the asset type
   */
  constructor(assetType) {
    if (new.target === AssetMetadata) {
      throw new TypeError('Cannot construct AssetMetadata directly; subclass required');
    }
    this.assetType = assetType;
  }

  /**
   * Return the list of required field names for this asset metadata
   * @returns {string[]}
   */
  getRequiredFields() {
    return [];
  }

  /**
   * Return the list of protected identity fields that cannot be altered once verified
   * @returns {string[]}
   */
  getProtectedFields() {
    return ['assetId', 'ownerId', 'uniqueAssetIdentifier', 'currency', 'originalValue'];
  }

  /**
   * Normalize and sanitize raw input metadata into a consistent canonical shape
   * @param {object} rawMetadata
   * @returns {object}
   */
  normalize(rawMetadata = {}) {
    return { ...rawMetadata };
  }

  /**
   * Generate a unique domain identifier for the asset (e.g. RAIL-PNR-12345, BUS-OP-987)
   * @param {object} metadata
   * @param {object} [fallbackContext]
   * @returns {string}
   */
  generateIdentifier(metadata = {}, fallbackContext = {}) {
    throw new Error('generateIdentifier() must be implemented by subclass');
  }

  /**
   * Generate a human-readable display title for this asset
   * @param {object} metadata
   * @returns {string}
   */
  generateTitle(metadata = {}) {
    return `${this.assetType} Asset`;
  }

  /**
   * Generate a detailed summary description
   * @param {object} metadata
   * @returns {string}
   */
  generateSummary(metadata = {}) {
    return `${this.assetType}: ${this.generateTitle(metadata)}`;
  }
}
