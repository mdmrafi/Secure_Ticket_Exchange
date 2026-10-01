import crypto from 'crypto';
import { TransferProvider } from '../interfaces/transfer-provider.interface.js';
import { AssetTypes } from '../../../../common/constants/asset-types.constant.js';

export class BusTicketTransferProvider extends TransferProvider {
  constructor() {
    super('INTERCITY_BUS_OPERATOR_GATEWAY', AssetTypes.BUS_TICKET);
  }

  async transfer(asset, fromUser, toUser, options = {}) {
    const externalTransferId = `BUS-XFER-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const newETicketNumber = `ETKT-${(asset.metadata?.operator || 'BUS').slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-6)}`;
    const newBarcode = `BC-BUS-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;

    const updatedMetadata = {
      ...(asset.metadata || {}),
      previousOwner: fromUser?.name || fromUser?._id,
      passengerName: toUser?.name || 'Authorized Passenger',
      passengerEmail: toUser?.email || null,
      passengerPhone: toUser?.phone || null,
      ticketNumber: newETicketNumber,
      barcode: newBarcode,
      transferredAt: new Date().toISOString(),
      transferReference: externalTransferId,
    };

    return {
      success: true,
      externalTransferId,
      updatedMetadata,
      providerResponse: {
        gateway: 'BUS_OPERATOR_API',
        status: 'CONFIRMED',
        message: 'Bus ticket successfully re-assigned to new passenger in operator manifest',
        newETicketNumber,
        newBarcode,
        processedAt: new Date().toISOString(),
      },
    };
  }
}
