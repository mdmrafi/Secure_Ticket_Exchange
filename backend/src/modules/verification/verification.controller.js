import { verificationService } from './verification.service.js';
import { ApiResponse } from '../../common/utils/api-response.js';
import { asyncHandler } from '../../common/utils/async-handler.js';

export class VerificationController {
  constructor(service = verificationService) {
    this.service = service;
  }

  requestVerification = asyncHandler(async (req, res) => {
    const verification = await this.service.requestVerification(req.user.userId, req.body.assetId);
    return ApiResponse.created(res, verification, 'Verification request queued for fraud check');
  });

  getStatus = asyncHandler(async (req, res) => {
    const status = await this.service.getVerificationStatus(req.params.assetId);
    return ApiResponse.success(res, status, 'Verification status retrieved');
  });
}

export const verificationController = new VerificationController();
