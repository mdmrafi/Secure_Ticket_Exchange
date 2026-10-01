import { AssetVerifier } from '../interfaces/asset-verifier.interface.js';
import {
  AssetTypes,
  VerificationStatus,
} from '../../../../common/constants/asset-types.constant.js';
import { verificationEngine } from '../../../verification/engine/verification-engine.js';
import { RailwayTicketVerifier as CoreRailwayVerifier } from '../../../verification/verifiers/railway-ticket.verifier.js';

export class RailwayTicketVerifier extends AssetVerifier {
  constructor() {
    super(AssetTypes.RAILWAY_TICKET);
    this.coreVerifier = new CoreRailwayVerifier();
  }

  async verify(asset, context = {}) {
    // If comprehensive verification engine context is available, run multi-layer verification
    if (verificationEngine && typeof verificationEngine.verifyTicket === 'function') {
      try {
        const engineResult = await verificationEngine.verifyTicket(asset, context);
        return {
          isVerified: engineResult.isVerified,
          status: engineResult.status,
          confidenceScore: engineResult.confidenceScore || 0,
          checks: engineResult.checks || [],
          fraudFlags: engineResult.fraudFlags || [],
          details: engineResult.details || {},
        };
      } catch (err) {
        // Fall back to core verifier if engine threw error
      }
    }

    return this.coreVerifier.verify(asset);
  }
}
