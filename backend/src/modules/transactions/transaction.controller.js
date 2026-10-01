import { transactionService } from './transaction.service.js';
import { ApiResponse } from '../../common/utils/api-response.js';
import { asyncHandler } from '../../common/utils/async-handler.js';

export class TransactionController {
  constructor(service = transactionService) {
    this.service = service;
  }

  /**
   * Initiate transaction
   * POST /api/v1/transactions
   */
  initiate = asyncHandler(async (req, res) => {
    const transaction = await this.service.initiateTransaction(
      req.user.userId,
      req.body.listingId
    );
    return ApiResponse.created(res, transaction, 'Exchange transaction initiated');
  });

  /**
   * Create payment checkout session
   * POST /api/v1/transactions/:id/pay
   */
  createPaymentSession = asyncHandler(async (req, res) => {
    const result = await this.service.createPaymentSession(
      req.params.id,
      req.user.userId
    );
    return ApiResponse.success(res, result, 'Payment session initialized');
  });

  /**
   * Process simulated payment
   * POST /api/v1/transactions/:id/process-payment
   */
  processPayment = asyncHandler(async (req, res) => {
    const transaction = await this.service.processPayment(
      req.params.id,
      req.user.userId,
      req.body
    );
    return ApiResponse.success(res, transaction, 'Payment processed successfully');
  });

  /**
   * Payment provider webhook / callback with idempotency
   * POST /api/v1/transactions/:id/callback
   */
  callback = asyncHandler(async (req, res) => {
    const result = await this.service.handlePaymentCallback(
      req.params.id,
      req.body
    );
    return ApiResponse.success(res, result, 'Payment callback received');
  });

  /**
   * Execute asset ownership transfer and complete transaction
   * POST /api/v1/transactions/:id/transfer
   */
  transfer = asyncHandler(async (req, res) => {
    const transaction = await this.service.transferAsset(
      req.params.id,
      req.user.userId,
      req.user.role
    );
    return ApiResponse.success(res, transaction, 'Asset transferred and transaction completed');
  });

  /**
   * Cancel transaction
   * POST /api/v1/transactions/:id/cancel
   */
  cancel = asyncHandler(async (req, res) => {
    const transaction = await this.service.cancelTransaction(
      req.params.id,
      req.user.userId,
      req.user.role,
      req.body?.reason
    );
    return ApiResponse.success(res, transaction, 'Transaction cancelled successfully');
  });

  /**
   * Get transaction details by ID
   * GET /api/v1/transactions/:id
   */
  getById = asyncHandler(async (req, res) => {
    const transaction = await this.service.getTransactionById(
      req.params.id,
      req.user.userId,
      req.user.role
    );
    return ApiResponse.success(res, transaction, 'Transaction details retrieved');
  });

  /**
   * Get immutable event history for transaction
   * GET /api/v1/transactions/:id/events
   */
  getEvents = asyncHandler(async (req, res) => {
    const events = await this.service.getTransactionEvents(
      req.params.id,
      req.user.userId,
      req.user.role
    );
    return ApiResponse.success(res, events, 'Transaction audit events retrieved');
  });

  /**
   * List transactions for authenticated user
   * GET /api/v1/transactions/my
   */
  getMyTransactions = asyncHandler(async (req, res) => {
    const result = await this.service.getMyTransactions(req.user.userId, req.query);
    return ApiResponse.success(
      res,
      result.transactions,
      'User transactions retrieved',
      200,
      result.pagination
    );
  });
}

export const transactionController = new TransactionController();
