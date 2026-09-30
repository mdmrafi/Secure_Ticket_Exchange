/**
 * Abstract Asset Verifier Interface
 *
 * Defines the contract for modular asset verifiers.
 * Each asset type (Railway ticket, Bus ticket, Event pass, Document)
 * will implement its own verifier conforming to this interface.
 */
export class AssetVerifier {
  /**
   * Return the identifier name of this verifier
   * @returns {string}
   */
  getAssetType() {
    throw new Error('getAssetType() must be implemented by subclass');
  }

  /**
   * Verify the authenticity, format, and ownership of an asset.
   *
   * @param {object} asset - The asset document or domain instance
   * @returns {Promise<{
   *   isVerified: boolean,
   *   status: string,
   *   confidenceScore: number,
   *   checks: Array<{
   *     checkType: string,
   *     status: 'PENDING' | 'PASSED' | 'FAILED',
   *     score?: number,
   *     details?: any
   *   }>,
   *   fraudFlags: Array<{
   *     code: string,
   *     description: string,
   *     severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
   *   }>,
   *   details: object
   * }>}
   */
  async verify(asset) {
    throw new Error('verify(asset) must be implemented by concrete subclass');
  }
}
