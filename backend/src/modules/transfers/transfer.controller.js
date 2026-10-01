import { transferService } from './transfer.service.js';
import { ApiResponse } from '../../common/utils/api-response.js';
import { asyncHandler } from '../../common/utils/async-handler.js';

export class TransferController {
  constructor(service = transferService) {
    this.service = service;
  }

  /**
   * Check asset transfer eligibility
   * GET /api/v1/transfers/eligibility/:assetId
   */
  checkEligibility = asyncHandler(async (req, res) => {
    const result = await this.service.checkEligibility(req.params.assetId, {
      fromUserId: req.query.fromUserId || req.user?.userId,
      toUserId: req.query.toUserId,
    });
    return ApiResponse.success(res, result, 'Transfer eligibility evaluated');
  });

  /**
   * Request asset transfer
   * POST /api/v1/transfers
   */
  requestTransfer = asyncHandler(async (req, res) => {
    const transferReq = await this.service.requestTransfer(
      req.body,
      req.user.userId,
      req.user.role
    );
    return ApiResponse.created(res, transferReq, 'Asset transfer requested successfully');
  });

  /**
   * Approve asset transfer
   * POST /api/v1/transfers/:id/approve
   */
  approveTransfer = asyncHandler(async (req, res) => {
    const updated = await this.service.approveTransfer(
      req.params.id,
      req.user.userId,
      req.user.role
    );
    return ApiResponse.success(res, updated, 'Asset transfer approved');
  });

  /**
   * Execute asset transfer
   * POST /api/v1/transfers/:id/execute
   */
  executeTransfer = asyncHandler(async (req, res) => {
    const result = await this.service.executeTransfer(
      req.params.id,
      req.user.userId,
      req.body || {},
      req.user.role
    );
    return ApiResponse.success(res, result, 'Asset transfer executed');
  });

  /**
   * Reject asset transfer
   * POST /api/v1/transfers/:id/reject
   */
  rejectTransfer = asyncHandler(async (req, res) => {
    const updated = await this.service.rejectTransfer(
      req.params.id,
      req.user.userId,
      req.body?.reason || 'Transfer rejected',
      req.user.role
    );
    return ApiResponse.success(res, updated, 'Asset transfer rejected');
  });

  /**
   * Cancel asset transfer
   * POST /api/v1/transfers/:id/cancel
   */
  cancelTransfer = asyncHandler(async (req, res) => {
    const updated = await this.service.cancelTransfer(
      req.params.id,
      req.user.userId,
      req.body?.reason || 'Transfer cancelled by user',
      req.user.role
    );
    return ApiResponse.success(res, updated, 'Asset transfer cancelled');
  });

  /**
   * Get transfer request details
   * GET /api/v1/transfers/:id
   */
  getTransferById = asyncHandler(async (req, res) => {
    const transferReq = await this.service.getTransferById(
      req.params.id,
      req.user.userId,
      req.user.role
    );
    return ApiResponse.success(res, transferReq, 'Transfer request retrieved');
  });

  /**
   * Get immutable transfer audit events
   * GET /api/v1/transfers/:id/events
   */
  getTransferEvents = asyncHandler(async (req, res) => {
    const events = await this.service.getTransferEvents(
      req.params.id,
      req.user.userId,
      req.user.role
    );
    return ApiResponse.success(res, events, 'Transfer audit events retrieved');
  });
}

export const transferController = new TransferController();
