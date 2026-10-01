import { AssetAdapter } from '../interfaces/asset-adapter.interface.js';
import { AssetTypes } from '../../../../common/constants/asset-types.constant.js';
import { DocumentMetadata } from './document.metadata.js';
import { DocumentValidator } from './document.validator.js';
import { DocumentVerifier } from './document.verifier.js';
import { DocumentTransferPolicy } from './document.transfer-policy.js';
import { DocumentTransferProvider } from './document.transfer-provider.js';

export class DocumentAdapter extends AssetAdapter {
  constructor() {
    super({
      assetType: AssetTypes.DOCUMENT,
      displayName: 'Digital Document',
      metadata: new DocumentMetadata(),
      validator: new DocumentValidator(),
      verifier: new DocumentVerifier(),
      transferPolicy: new DocumentTransferPolicy(),
      transferProvider: new DocumentTransferProvider(),
    });
  }
}
