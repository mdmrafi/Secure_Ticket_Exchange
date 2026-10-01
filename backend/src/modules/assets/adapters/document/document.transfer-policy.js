import { TransferPolicy } from '../interfaces/transfer-policy.interface.js';
import { AssetTypes } from '../../../../common/constants/asset-types.constant.js';

export class DocumentTransferPolicy extends TransferPolicy {
  constructor() {
    super(AssetTypes.DOCUMENT);
  }

  isTransferable(asset) {
    if (asset?.isTransferable === false) return false;
    const cat = (asset?.metadata?.documentCategory || '').toUpperCase();
    if (cat.includes('IDENTITY') || cat.includes('NID') || cat.includes('PASSPORT')) {
      return false;
    }
    return true;
  }

  requiresAuthorizedProvider(asset) {
    const cat = (asset?.metadata?.documentCategory || '').toUpperCase();
    return cat.includes('DEED') || cat.includes('CONTRACT') || cat.includes('EQUITY');
  }

  allowsDirectIdentityModification(asset) {
    return false;
  }

  validateListingPrice(asset, askingPrice) {
    const faceValue = Number(asset.originalValue || asset.metadata?.originalValue || 0);
    const price = Number(askingPrice);

    if (price < 0) {
      return { allowed: false, reason: 'Price cannot be negative', maxAllowedPrice: faceValue };
    }

    if (!this.isTransferable(asset)) {
      return {
        allowed: false,
        reason: 'Identity documents and government records cannot be listed',
        maxAllowedPrice: 0,
      };
    }

    return { allowed: true, maxAllowedPrice: faceValue > 0 ? faceValue : price };
  }

  isKycRequired(asset, askingPrice, seller = {}) {
    // Legal documents require Level 2 KYC
    return true;
  }

  checkTransferEligibility(asset, fromUser, toUser, context = {}) {
    const reasons = [];

    if (!this.isTransferable(asset)) {
      reasons.push(
        'Legal identity documents and government records cannot be transferred between individuals.'
      );
    }

    if (asset.metadata?.validUntil) {
      const exp = new Date(asset.metadata.validUntil).getTime();
      if (!isNaN(exp) && exp < Date.now()) {
        reasons.push('Cannot transfer an expired legal document or voucher');
      }
    }

    return {
      eligible: reasons.length === 0,
      reasons,
      reason: reasons.join(', '),
      policyCode: reasons.length > 0 ? 'LEGALLY_NON_TRANSFERABLE' : undefined,
    };
  }

  getProtectedFields() {
    return [
      'documentCategory',
      'issuer',
      'documentNumber',
      'issuedAt',
      'validUntil',
      'digitalSignature',
      'originalValue',
      'currency',
    ];
  }
}
