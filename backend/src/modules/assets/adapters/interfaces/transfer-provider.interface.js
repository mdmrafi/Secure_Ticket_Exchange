/**
 * TransferProvider Interface
 *
 * Defines the contract for executing the digital or physical ownership transfer of an asset.
 */
export class TransferProvider {
  /**
   * @param {string} providerId
   * @param {string} [supportedAssetType]
   */
  constructor(providerId = 'GENERIC_TRANSFER_PROVIDER', supportedAssetType = null) {
    if (new.target === TransferProvider) {
      throw new TypeError('Cannot construct TransferProvider directly; subclass required');
    }
    this.providerId = providerId;
    this.supportedAssetType = supportedAssetType;
  }

  /**
   * Check whether this provider can handle the given asset
   * @param {object} asset
   * @returns {boolean}
   */
  supports(asset) {
    if (this.supportedAssetType) {
      return asset?.assetType === this.supportedAssetType;
    }
    return true;
  }

  /**
   * Execute asset transfer
   * @param {object} asset
   * @param {object} fromUser
   * @param {object} toUser
   * @param {object} [options={}]
   * @returns {Promise<{
   *   success: boolean,
   *   externalTransferId?: string,
   *   updatedMetadata?: object,
   *   providerResponse?: object,
   *   error?: string
   * }>}
   */
  async transfer(asset, fromUser, toUser, options = {}) {
    throw new Error('transfer() must be implemented by subclass');
  }
}
