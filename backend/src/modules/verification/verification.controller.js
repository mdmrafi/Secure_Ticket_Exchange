import { verificationService } from './verification.service.js';
import { ApiResponse } from '../../common/utils/api-response.js';
import { asyncHandler } from '../../common/utils/async-handler.js';

export class VerificationController {
  constructor(service = verificationService) {
    this.service = service;
  }

  /**
   * POST /api/v1/verification/request
   * Queue or initiate verification request
   */
  requestVerification = asyncHandler(async (req, res) => {
    const verification = await this.service.requestVerification(
      req.user.userId,
      req.body.assetId,
      req.body
    );
    return ApiResponse.created(res, verification, 'Verification request initiated');
  });

  /**
   * POST /api/v1/verification/railway/:assetId
   * Run multi-layer VerificationEngine on a railway ticket
   */
  verifyRailway = asyncHandler(async (req, res) => {
    const result = await this.service.verifyRailwayTicket(req.params.assetId, req.user, req.body);

    const message =
      result.status === 'VERIFIED'
        ? 'Railway ticket successfully verified across all signals'
        : result.status === 'SUSPICIOUS'
          ? 'Warning: Suspicious signals or mismatch detected during verification'
          : result.status === 'MANUAL_REVIEW'
            ? 'Ticket routed to manual review fallback'
            : 'Railway ticket verification failed';

    return ApiResponse.success(res, result, message);
  });

  /**
   * GET /api/v1/verification/status/:assetId
   * Retrieve verification record and check results
   */
  getStatus = asyncHandler(async (req, res) => {
    const status = await this.service.getVerificationStatus(req.params.assetId);
    return ApiResponse.success(res, status, 'Verification status retrieved');
  });
}

export const verificationController = new VerificationController();
