import crypto from 'crypto';
import { TransferProvider } from '../interfaces/transfer-provider.interface.js';
import { AssetTypes } from '../../../../common/constants/asset-types.constant.js';

export class EventTicketTransferProvider extends TransferProvider {
  constructor() {
    super('DIGITAL_PASS_TICKETING_ENGINE', AssetTypes.EVENT_TICKET);
  }

  async transfer(asset, fromUser, toUser, options = {}) {
    const externalTransferId = `EVT-XFER-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const previousBarcode = asset.metadata?.barcode || null;
    // Generate fresh dynamic encrypted barcode for the new holder
    const newBarcode = `DYN-QR-${Date.now()}-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;

    const updatedMetadata = {
      ...(asset.metadata || {}),
      previousHolder: fromUser?.name || fromUser?._id,
      ticketHolder: toUser?.name || 'Verified Pass Holder',
      holderEmail: toUser?.email || null,
      barcode: newBarcode,
      invalidatedBarcodes: [
        ...(asset.metadata?.invalidatedBarcodes || []),
        ...(previousBarcode ? [previousBarcode] : []),
      ],
      transferredAt: new Date().toISOString(),
      transferReference: externalTransferId,
    };

    return {
      success: true,
      externalTransferId,
      updatedMetadata,
      providerResponse: {
        gateway: 'EVENT_TICKETING_PLATFORM',
        status: 'TRANSFERRED',
        message: 'Previous barcode invalidated; new dynamic QR issued to recipient',
        newBarcode,
        invalidatedBarcode: previousBarcode,
        processedAt: new Date().toISOString(),
      },
    };
  }
}
