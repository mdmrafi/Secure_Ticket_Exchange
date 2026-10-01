/**
 * AssetVerifier Interface
 *
 * Evaluates authenticity, integrity, OCR fidelity, and external registry validity of an asset.
 */
export class AssetVerifier {
  /**
   * @param {string} assetType
   */
  constructor(assetType) {
    if (new.target === AssetVerifier) {
      throw new TypeError('Cannot construct AssetVerifier directly; subclass required');
    }
    this.assetType = assetType;
  }

  /**
   * Return the identifier name of this verifier
   * @returns {string}
   */
  getAssetType() {
    return this.assetType;
  }

  /**
   * Perform asset verification
   * @param {object} asset
   * @param {object} [context={}]
   * @returns {Promise<{
   *   isVerified: boolean,
   *   status: 'VERIFIED' | 'FAILED' | 'SUSPICIOUS',
   *   confidenceScore: number,
   *   checks: Array<{ checkType: string, status: string, details?: any }>,
   *   fraudFlags: Array<{ code: string, description: string, severity: string }>,
   *   details: object
   * }>}
   */
  async verify(asset, context = {}) {
    throw new Error('verify() must be implemented by subclass');
  }
}
