/**
 * TransferProvider Interface
 *
 * Abstract base class defining the contract for asset transfer providers.
 * All external transfer integrations (e.g. Bangladesh Railway authorized provider,
 * Shohoz, Eventbrite, Ticketmaster, Mock Provider) must implement this contract.
 */
export class TransferProvider {
  /**
   * @param {string} providerId - Unique provider identifier
   * @param {object} [options]
   */
  constructor(providerId = 'BASE_TRANSFER_PROVIDER', options = {}) {
    if (new.target === TransferProvider) {
      throw new TypeError('Cannot construct TransferProvider instances directly');
    }
    this.providerId = providerId;
    this.options = options;
  }

  /**
   * Determines whether this provider supports the given asset
   * @param {object} asset
   * @returns {boolean}
   */
  supports(asset) {
    throw new Error('Method supports() must be implemented');
  }

  /**
   * Execute asset transfer between fromUser and toUser
   *
   * @param {object} asset - The asset document
   * @param {object} fromUser - Originating owner
   * @param {object} toUser - Recipient user
   * @param {object} [options] - Execution parameters
   * @returns {Promise<{
   *   success: boolean,
   *   externalTransferId?: string,
   *   updatedMetadata?: object,
   *   providerResponse?: object,
   *   error?: string
   * }>}
   */
  async transfer(asset, fromUser, toUser, options = {}) {
    throw new Error('Method transfer() must be implemented');
  }
}
