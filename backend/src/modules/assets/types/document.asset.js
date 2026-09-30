import { BaseAsset } from './base-asset.js';
import { AssetTypes } from '../../../common/constants/asset-types.constant.js';

/**
 * DocumentAsset Domain Model
 * Supports future legal, voucher, and certificate digital asset transfers.
 */
export class DocumentAsset extends BaseAsset {
  constructor(data = {}) {
    super({
      ...data,
      assetType: AssetTypes.DOCUMENT,
    });
  }

  get documentCategory() {
    return this.metadata?.documentCategory;
  }

  get issuer() {
    return this.metadata?.issuer;
  }

  generateUniqueIdentifier() {
    if (this.metadata?.documentNumber) {
      return `DOC-${this.documentCategory || 'GEN'}-${this.metadata.documentNumber}`;
    }
    return super.generateUniqueIdentifier();
  }

  getSummary() {
    return `Document Asset: ${this.title || this.documentCategory || 'Verified Document'}`;
  }
}
