import { AssetMetadata } from '../interfaces/asset-metadata.interface.js';
import { AssetTypes } from '../../../../common/constants/asset-types.constant.js';

export class DocumentMetadata extends AssetMetadata {
  constructor() {
    super(AssetTypes.DOCUMENT);
  }

  getRequiredFields() {
    return ['documentCategory', 'issuer', 'documentNumber'];
  }

  getProtectedFields() {
    return [
      'assetId',
      'sellerId',
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

  normalize(raw = {}) {
    const documentCategory = (
      raw.documentCategory ||
      raw.category ||
      'TRANSFERABLE_VOUCHER'
    ).toUpperCase();
    const issuer = raw.issuer || raw.issuingAuthority || 'Authorized Organization';
    const documentNumber = raw.documentNumber || raw.serialNumber || raw.docId || null;

    return {
      ...raw,
      documentCategory,
      issuer: String(issuer).trim(),
      documentNumber: documentNumber ? String(documentNumber).trim() : null,
      issuedAt: raw.issuedAt ? String(raw.issuedAt).trim() : new Date().toISOString(),
      validUntil: raw.validUntil ? String(raw.validUntil).trim() : null,
      terms: raw.terms || 'Standard digital document transfer terms apply.',
      digitalSignature: raw.digitalSignature || null,
      originalValue: Number(raw.originalValue || raw.value || 0),
    };
  }

  generateIdentifier(metadata = {}, fallbackContext = {}) {
    const cat = (metadata.documentCategory || 'GEN').replace(/[^A-Za-z0-9]/g, '').slice(0, 6);
    const num = metadata.documentNumber || Math.random().toString(36).substring(2, 8).toUpperCase();
    return `DOC-${cat}-${num}`;
  }

  generateTitle(metadata = {}) {
    const cat = metadata.documentCategory || 'Document';
    const num = metadata.documentNumber ? ` #${metadata.documentNumber}` : '';
    return `${cat}${num}`;
  }

  generateSummary(metadata = {}) {
    const issuer = metadata.issuer ? ` | Issuer: ${metadata.issuer}` : '';
    const expiry = metadata.validUntil ? ` | Valid until: ${metadata.validUntil}` : '';
    return `${this.generateTitle(metadata)}${issuer}${expiry}`;
  }
}
