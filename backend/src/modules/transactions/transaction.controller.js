import { transactionService } from './transaction.service.js';
import { ApiResponse } from '../../common/utils/api-response.js';
import { asyncHandler } from '../../common/utils/async-handler.js';

export class TransactionController {
  constructor(service = transactionService) {
    this.service = service;
  }

  initiate = asyncHandler(async (req, res) => {
    const transaction = await this.service.initiateTransaction(req.user.userId, req.body.listingId);
    return ApiResponse.created(res, transaction, 'Exchange transaction initiated');
  });

  getById = asyncHandler(async (req, res) => {
    const transaction = await this.service.getTransactionById(req.params.id, req.user.userId);
    return ApiResponse.success(res, transaction, 'Transaction details retrieved');
  });

  getMyTransactions = asyncHandler(async (req, res) => {
    const result = await this.service.getMyTransactions(req.user.userId, req.query);
    return ApiResponse.success(res, result.transactions, 'User transactions retrieved', 200, result.pagination);
  });
}

export const transactionController = new TransactionController();
