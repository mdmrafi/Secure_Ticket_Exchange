import { Transaction } from './transaction.model.js';

export class TransactionRepository {
  async findById(id) {
    return Transaction.findById(id)
      .populate('assetId')
      .populate('listingId')
      .populate('buyerId', 'name email trustScore')
      .populate('sellerId', 'name email trustScore');
  }

  async create(data) {
    return Transaction.create(data);
  }

  async updateById(id, updateData) {
    return Transaction.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
  }

  async listByUser(userId, filter = {}, pagination = { skip: 0, limit: 20 }) {
    const userFilter = {
      $or: [{ buyerId: userId }, { sellerId: userId }],
      ...filter,
    };

    const [items, total] = await Promise.all([
      Transaction.find(userFilter)
        .populate('assetId')
        .populate('buyerId', 'name email')
        .populate('sellerId', 'name email')
        .skip(pagination.skip)
        .limit(pagination.limit)
        .sort({ createdAt: -1 }),
      Transaction.countDocuments(userFilter),
    ]);

    return { items, total };
  }
}

export const transactionRepository = new TransactionRepository();
