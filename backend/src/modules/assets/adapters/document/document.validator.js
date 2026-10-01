import { AssetValidator } from '../interfaces/asset-validator.interface.js';
import { AssetTypes } from '../../../../common/constants/asset-types.constant.js';

export class DocumentValidator extends AssetValidator {
  constructor() {
    super(AssetTypes.DOCUMENT);
  }

  validateAsset(assetData = {}) {
    const errors = [];
    const meta = assetData.metadata || {};

    if (!meta.documentCategory) {
      errors.push('Document requires a category (e.g. TRANSFERABLE_VOUCHER, DEED, LICENSE)');
    }

    if (!meta.issuer) {
      errors.push('Document requires an issuing authority or organization name');
    }

    if (!meta.documentNumber && !assetData.uniqueAssetIdentifier) {
      errors.push('Document requires a document number or serial code');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  validateListing(asset, listingData = {}, seller = {}) {
    const errors = [];
    const meta = asset.metadata || {};
    const category = (meta.documentCategory || '').toUpperCase();

    // Critical policy check: Government identity documents are strictly non-transferable
    if (
      category.includes('IDENTITY') ||
      category.includes('PASSPORT') ||
      category.includes('NID')
    ) {
      errors.push(
        'Personal identity documents and government records cannot be listed or transferred on the exchange'
      );
    }

    const askingPrice = Number(
      listingData.askingPrice !== undefined ? listingData.askingPrice : listingData.price
    );
    if (askingPrice < 0) {
      errors.push('Asking price cannot be negative');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  validateUpdate(currentRecord, updateData = {}, userRole = 'USER') {
    const errors = [];
    const protectedFields = [
      'documentCategory',
      'issuer',
      'documentNumber',
      'issuedAt',
      'digitalSignature',
    ];

    if (userRole !== 'ADMIN') {
      const violated = protectedFields.filter((f) => f in updateData);
      if (violated.length > 0) {
        errors.push(
          `Modification of protected document fields is prohibited: [${violated.join(', ')}]`
        );
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
