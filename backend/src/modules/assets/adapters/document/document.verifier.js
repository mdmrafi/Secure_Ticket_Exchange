import { AssetVerifier } from '../interfaces/asset-verifier.interface.js';
import {
  AssetTypes,
  VerificationStatus,
} from '../../../../common/constants/asset-types.constant.js';

export class DocumentVerifier extends AssetVerifier {
  constructor() {
    super(AssetTypes.DOCUMENT);
  }

  async verify(asset, context = {}) {
    const meta = asset.metadata || {};
    const checks = [];
    const fraudFlags = [];
    let score = 100;

    // 1. Category check
    const category = (meta.documentCategory || '').toUpperCase();
    if (
      category.includes('IDENTITY') ||
      category.includes('NID') ||
      category.includes('PASSPORT')
    ) {
      score = 0;
      checks.push({
        checkType: 'CATEGORY_LEGALITY',
        status: 'FAILED',
        details: 'Personal identity documents are non-transferable',
      });
      fraudFlags.push({
        code: 'NON_TRANSFERABLE_ID_DOC',
        description: 'Attempted exchange of personal identity document',
        severity: 'CRITICAL',
      });
    } else {
      checks.push({
        checkType: 'CATEGORY_LEGALITY',
        status: 'PASSED',
        details: `Category: ${category || 'Voucher/Deed'}`,
      });
    }

    // 2. Issuer verification
    if (meta.issuer && meta.issuer.trim().length >= 3) {
      checks.push({
        checkType: 'ISSUER_INTEGRITY',
        status: 'PASSED',
        details: `Issuer: ${meta.issuer}`,
      });
    } else {
      score -= 30;
      checks.push({
        checkType: 'ISSUER_INTEGRITY',
        status: 'FAILED',
        details: 'Unknown or missing issuer',
      });
    }

    // 3. Document Number Check
    const docNum = meta.documentNumber || asset.uniqueAssetIdentifier;
    if (docNum && String(docNum).length >= 4) {
      checks.push({
        checkType: 'DOCUMENT_SERIAL_CHECK',
        status: 'PASSED',
        details: `Serial: ${docNum}`,
      });
    } else {
      score -= 25;
      checks.push({
        checkType: 'DOCUMENT_SERIAL_CHECK',
        status: 'FAILED',
        details: 'Missing document serial number',
      });
    }

    // 4. Expiry / Validity Date Check
    if (meta.validUntil) {
      const expiry = new Date(meta.validUntil);
      if (!isNaN(expiry.getTime()) && expiry < new Date()) {
        score -= 50;
        checks.push({
          checkType: 'EXPIRATION_CHECK',
          status: 'FAILED',
          details: 'Document has expired',
        });
        fraudFlags.push({
          code: 'EXPIRED_DOCUMENT',
          description: 'Document validity expired',
          severity: 'HIGH',
        });
      } else {
        checks.push({
          checkType: 'EXPIRATION_CHECK',
          status: 'PASSED',
          details: `Valid until: ${meta.validUntil}`,
        });
      }
    }

    const isVerified = score >= 70 && fraudFlags.every((f) => f.severity !== 'CRITICAL');
    const status = isVerified
      ? VerificationStatus.VERIFIED
      : fraudFlags.some((f) => f.severity === 'CRITICAL')
        ? VerificationStatus.FAILED
        : VerificationStatus.SUSPICIOUS;

    return {
      isVerified,
      status,
      confidenceScore: Math.max(0, score),
      checks,
      fraudFlags,
      details: {
        documentCategory: meta.documentCategory,
        issuer: meta.issuer,
        serialNumber: docNum,
        verifiedAt: new Date().toISOString(),
      },
    };
  }
}
