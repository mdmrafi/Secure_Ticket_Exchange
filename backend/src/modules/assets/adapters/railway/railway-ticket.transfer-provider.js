import { TransferProvider } from '../interfaces/transfer-provider.interface.js';
import { AssetTypes } from '../../../../common/constants/asset-types.constant.js';
import { MockTransferProvider } from '../../../transfers/providers/mock-transfer.provider.js';

export class RailwayTicketTransferProvider extends TransferProvider {
  constructor() {
    super('RAILWAY_OFFICIAL_TRANSFER_PROVIDER', AssetTypes.RAILWAY_TICKET);
    this.coreProvider = new MockTransferProvider();
  }

  async transfer(asset, fromUser, toUser, options = {}) {
    // Delegate to authorized mock railway transfer provider
    return this.coreProvider.transfer(asset, fromUser, toUser, options);
  }
}
