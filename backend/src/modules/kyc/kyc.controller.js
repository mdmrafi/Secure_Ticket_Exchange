import { kycService } from './kyc.service.js';
import { ApiResponse } from '../../common/utils/api-response.js';
import { asyncHandler } from '../../common/utils/async-handler.js';
import { HttpStatus } from '../../common/constants/http-status.constant.js';

export class KYCController {
  constructor(service = kycService) {
    this.service = service;
  }

  /**
   * Helper to extract client audit info from request
   */
  getClientContext(req) {
    return {
      ip: req.ip || req.connection?.remoteAddress || req.headers['x-forwarded-for'] || '127.0.0.1',
      userAgent: req.headers['user-agent'] || 'unknown',
    };
  }

  /**
   * POST /api/v1/kyc/start
   * Start or reset a KYC verification session for the authenticated user
   */
  start = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const clientContext = this.getClientContext(req);
    const result = await this.service.startKYC(userId, req.body, clientContext);

    return ApiResponse.created(
      res,
      result,
      'Identity verification session started successfully'
    );
  });

  /**
   * POST /api/v1/kyc/submit
   * Submit synthetic identity verification payload for evaluation
   */
  submit = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const clientContext = this.getClientContext(req);
    const result = await this.service.submitKYC(userId, req.body, clientContext);

    const message =
      result.status === 'VERIFIED'
        ? 'Identity verification completed successfully'
        : result.status === 'REJECTED'
        ? 'Identity verification was rejected'
        : 'Identity verification is pending or in review';

    return ApiResponse.success(res, result, message, HttpStatus.OK);
  });

  /**
   * GET /api/v1/kyc/status
   * Get current identity verification status for the authenticated user
   */
  getStatus = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const result = await this.service.getKYCStatus(userId);

    return ApiResponse.success(
      res,
      result,
      'KYC verification status retrieved successfully'
    );
  });

  /**
   * GET /api/v1/kyc/status/:userId
   * Query status for a specific user ID.
   * Enforces strict authorization boundary: only the account owner or ADMIN can view.
   */
  getUserStatusById = asyncHandler(async (req, res) => {
    const targetUserId = req.params.userId;
    const result = await this.service.getKYCRecordByUserIdWithAuth(req.user, targetUserId);

    return ApiResponse.success(
      res,
      result,
      'KYC status retrieved successfully'
    );
  });
}

export const kycController = new KYCController();
