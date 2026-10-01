import crypto from 'crypto';
import { TransferProvider } from '../interfaces/transfer-provider.interface.js';
import { AssetTypes } from '../../../../common/constants/asset-types.constant.js';

export class DocumentTransferProvider extends TransferProvider {
  constructor() {
    super('DIGITAL_DOCUMENT_NOTARY_REGISTRY', AssetTypes.DOCUMENT);
  }

  async transfer(asset, fromUser, toUser, options = {}) {
    const externalTransferId = `DOC-NOTARY-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const transferTimestamp = new Date().toISOString();

    // Compute cryptographic digital transfer signature
    const signaturePayload = `${asset.uniqueAssetIdentifier}|${fromUser._id}|${toUser._id}|${transferTimestamp}`;
    const digitalTransferSignature = crypto
      .createHash('sha256')
      .update(signaturePayload)
      .digest('hex');

    const updatedMetadata = {
      ...(asset.metadata || {}),
      previousLegalHolder: fromUser?.name || fromUser?._id,
      legalHolder: toUser?.name || 'Authorized Legal Holder',
      holderEmail: toUser?.email || null,
      transferNotaryId: externalTransferId,
      digitalTransferSignature,
      transferredAt: transferTimestamp,
    };

    return {
      success: true,
      externalTransferId,
      updatedMetadata,
      providerResponse: {
        notaryRegistry: 'DIGITAL_ASSET_NOTARY_CHAIN',
        status: 'EXECUTED',
        message: 'Legal rights and ownership deed transferred to recipient',
        digitalTransferSignature,
        processedAt: transferTimestamp,
      },
    };
  }
}
