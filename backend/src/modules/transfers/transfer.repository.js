import { TransferRequest } from './transfer-request.model.js';
import { TransferEvent } from './transfer-event.model.js';

export class TransferRepository {
  /**
   * Create a new transfer request record
   * @param {object} data
   * @param {object} [options]
   */
  async create(data, options = {}) {
    const docs = await TransferRequest.create([data], options);
    return docs[0];
  }

  /**
   * Find transfer request by ID with populated references
   * @param {string} id
   * @param {object} [options]
   */
  async findById(id, options = {}) {
    const query = TransferRequest.findById(id);
    if (options.session) {
      query.session(options.session);
    }
    return query
      .populate('assetId')
      .populate('fromUserId', 'name fullName email phone isVerified status')
      .populate('toUserId', 'name fullName email phone isVerified status')
      .populate('transactionId')
      .exec();
  }

  /**
   * Find one transfer request matching query
   * @param {object} query
   * @param {object} [options]
   */
  async findOne(query, options = {}) {
    const q = TransferRequest.findOne(query);
    if (options.session) {
      q.session(options.session);
    }
    return q
      .populate('assetId')
      .populate('fromUserId', 'name fullName email phone isVerified status')
      .populate('toUserId', 'name fullName email phone isVerified status')
      .populate('transactionId')
      .exec();
  }

  /**
   * Find transfer requests with filtering and pagination
   * @param {object} filter
   * @param {object} [options]
   */
  async find(filter = {}, options = {}) {
    const { page = 1, limit = 20, sort = { createdAt: -1 }, session } = options;
    const skip = (page - 1) * limit;

    const query = TransferRequest.find(filter);
    if (session) {
      query.session(session);
    }

    const [transfers, total] = await Promise.all([
      query
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('assetId', 'title assetType status uniqueAssetIdentifier isTransferable')
        .populate('fromUserId', 'name fullName email')
        .populate('toUserId', 'name fullName email')
        .exec(),
      TransferRequest.countDocuments(filter),
    ]);

    return {
      transfers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update transfer request by ID
   * @param {string} id
   * @param {object} updateData
   * @param {object} [options]
   */
  async updateById(id, updateData, options = {}) {
    const opts = { new: true, runValidators: true, ...options };
    return TransferRequest.findByIdAndUpdate(id, { $set: updateData }, opts)
      .populate('assetId')
      .populate('fromUserId', 'name fullName email phone status')
      .populate('toUserId', 'name fullName email phone status')
      .populate('transactionId')
      .exec();
  }

  /**
   * Find active transfer request for an asset (preventing concurrent transfers)
   * @param {string} assetId
   * @param {object} [options]
   */
  async findActiveByAssetId(assetId, options = {}) {
    return this.findOne(
      {
        assetId,
        status: { $in: ['REQUESTED', 'APPROVED', 'PROCESSING'] },
      },
      options
    );
  }

  /**
   * Record immutable transfer audit event
   * @param {object} eventData
   * @param {object} [options]
   */
  async recordEvent(eventData, options = {}) {
    const docs = await TransferEvent.create([eventData], options);
    return docs[0];
  }

  /**
   * Retrieve chronological event audit logs for a transfer request
   * @param {string} transferRequestId
   */
  async getEventsByRequestId(transferRequestId) {
    return TransferEvent.find({ transferRequestId })
      .sort({ createdAt: 1 })
      .populate('actorId', 'name fullName email role')
      .exec();
  }
}
