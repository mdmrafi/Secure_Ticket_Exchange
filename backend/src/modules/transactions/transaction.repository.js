import { Transaction } from './transaction.model.js';
import { TransactionEvent } from './transaction-event.model.js';

export class TransactionRepository {
  /**
   * Find a transaction by ID with full populated associations
   * @param {string} id
   * @param {object} [options]
   */
  async findById(id, options = {}) {
    let query = Transaction.findById(id)
      .populate('assetId')
      .populate('listingId')
      .populate('buyerId', 'name email trustScore accountStatus')
      .populate('sellerId', 'name email trustScore accountStatus');

    if (options.session) {
      query = query.session(options.session);
    }

    return query.exec();
  }

  /**
   * Find a single transaction matching filter
   * @param {object} filter
   * @param {object} [options]
   */
  async findOne(filter, options = {}) {
    let query = Transaction.findOne(filter);
    if (options.session) {
      query = query.session(options.session);
    }
    return query.exec();
  }

  /**
   * Create a new transaction document
   * @param {object} data
   * @param {object} [options]
   */
  async create(data, options = {}) {
    if (options.session) {
      const [doc] = await Transaction.create([data], { session: options.session });
      return doc;
    }
    return Transaction.create(data);
  }

  /**
   * Update a transaction by ID
   * @param {string} id
   * @param {object} updateData
   * @param {object} [options]
   */
  async updateById(id, updateData, options = {}) {
    const queryOptions = { new: true, runValidators: true };
    if (options.session) {
      queryOptions.session = options.session;
    }

    return Transaction.findByIdAndUpdate(id, updateData, queryOptions)
      .populate('assetId')
      .populate('listingId')
      .populate('buyerId', 'name email trustScore accountStatus')
      .populate('sellerId', 'name email trustScore accountStatus');
  }

  /**
   * List transactions for a user (as buyer or seller)
   * @param {string} userId
   * @param {object} filter
   * @param {{ skip: number, limit: number }} pagination
   */
  async listByUser(userId, filter = {}, pagination = { skip: 0, limit: 20 }) {
    const userFilter = {
      $or: [{ buyerId: userId }, { sellerId: userId }],
      ...filter,
    };

    const [items, total] = await Promise.all([
      Transaction.find(userFilter)
        .populate('assetId')
        .populate('listingId')
        .populate('buyerId', 'name email trustScore')
        .populate('sellerId', 'name email trustScore')
        .skip(pagination.skip)
        .limit(pagination.limit)
        .sort({ createdAt: -1 }),
      Transaction.countDocuments(userFilter),
    ]);

    return { items, total };
  }

  /**
   * Record an immutable transaction event log entry
   * @param {object} eventData
   * @param {object} [options]
   */
  async recordEvent(eventData, options = {}) {
    if (options.session) {
      const [event] = await TransactionEvent.create([eventData], { session: options.session });
      return event;
    }
    return TransactionEvent.create(eventData);
  }

  /**
   * Retrieve all immutable event history for a transaction
   * @param {string} transactionId
   */
  async getEventsByTransactionId(transactionId) {
    return TransactionEvent.find({ transactionId })
      .populate('actorId', 'name email role')
      .sort({ createdAt: 1 });
  }
}

export const transactionRepository = new TransactionRepository();
