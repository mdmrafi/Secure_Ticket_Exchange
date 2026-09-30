import { AssetVerifier } from './asset-verifier.interface.js';
import { AssetTypes, VerificationStatus } from '../../../common/constants/asset-types.constant.js';
import { logger } from '../../../config/logger.config.js';

/**
 * RailwayTicketVerifier
 *
 * Implements modular verification for Railway Ticket assets.
 * Note: Actual verification logic (external railway API gateway, OCR,
 * and PNR validation) is pending future integration.
 */
export class RailwayTicketVerifier extends AssetVerifier {
  getAssetType() {
    return AssetTypes.RAILWAY_TICKET;
  }

  /**
   * Verify a Railway Ticket asset.
   * Placeholder/stub implementation awaiting official gateway integration.
   *
   * @param {object} asset
   */
  async verify(asset) {
    logger.info(
      {
        assetId: asset._id || asset.id,
        assetType: this.getAssetType(),
        uniqueIdentifier: asset.uniqueAssetIdentifier,
      },
      '[RailwayTicketVerifier] Running verification stub for railway ticket'
    );

    const pnr = asset.metadata?.pnr || asset.uniqueAssetIdentifier;

    // Modular verification checks stub
    const checks = [
      {
        checkType: 'PNR_STRUCTURE_VALIDATION',
        status: pnr ? 'PASSED' : 'PENDING',
        score: pnr ? 100 : 0,
        details: { pnr: pnr || 'NOT_PROVIDED' },
        performedAt: new Date(),
      },
      {
        checkType: 'RAILWAY_GATEWAY_AUTHORITY',
        status: 'PENDING',
        score: 0,
        details: {
          note: 'Railway authority gateway integration pending (stub mode active)',
        },
        performedAt: new Date(),
      },
      {
        checkType: 'DUPLICATE_PNR_DETECTION',
        status: 'PASSED',
        score: 100,
        details: { duplicateFound: false },
        performedAt: new Date(),
      },
    ];

    return {
      isVerified: false,
      status: VerificationStatus.IN_REVIEW,
      confidenceScore: 50,
      checks,
      fraudFlags: [],
      details: {
        assetType: AssetTypes.RAILWAY_TICKET,
        stubMode: true,
        message: 'Railway ticket verification stub active. Authority integration pending.',
        evaluatedAt: new Date(),
      },
    };
  }
}

export const railwayTicketVerifier = new RailwayTicketVerifier();
