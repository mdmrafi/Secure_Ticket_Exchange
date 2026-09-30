import { transactionRepository } from './transaction.repository.js';
import { listingRepository } from '../listings/listing.repository.js';
import { NotFoundError, BadRequestError } from '../../common/errors/index.js';
import { ListingStatus, TransactionStatus } from '../../common/constants/asset-types.constant.js';

export class TransactionService {
  constructor(repo = transactionRepository, listingRepo = listingRepository) {
    this.repo = repo;
    this.listingRepo = listingRepo;
  }

  async initiateTransaction(buyerId, listingId) {
    const listing = await this.listingRepo.findById(listingId);
    if (!listing) {
      throw new NotFoundError('Listing not found');
    }

    if (listing.status !== ListingStatus.ACTIVE) {
      throw new BadRequestError('Listing is no longer active or available');
    }

    if (listing.sellerId._id.toString() === buyerId.toString()) {
      throw new BadRequestError('You cannot purchase your own listed asset');
    }

    const transaction = await this.repo.create({
      listingId: listing._id,
      assetId: listing.assetId._id,
      buyerId,
      sellerId: listing.sellerId._id,
      amount: listing.price,
      currency: listing.currency,
      status: TransactionStatus.INITIATED,
    });

    await this.listingRepo.updateById(listing._id, { status: ListingStatus.PENDING_ESCROW });

    return transaction;
  }

  async getTransactionById(id, userId) {
    const tx = await this.repo.findById(id);
    if (!tx) {
      throw new NotFoundError('Transaction not found');
    }
    return tx;
  }

  async getMyTransactions(userId, query = {}) {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const { items, total } = await this.repo.listByUser(userId, {}, { skip, limit });

    return {
      transactions: items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

export const transactionService = new TransactionService();
