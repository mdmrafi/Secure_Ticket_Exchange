import mongoose from 'mongoose';
import { Listing } from './listing.model.js';
import { ListingStatus } from '../../common/constants/asset-types.constant.js';

/**
 * Escapes regex special characters to prevent regex injection (ReDoS)
 * @param {string} str
 * @returns {string}
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export class ListingRepository {
  /**
   * Find a listing by ID with populated asset and seller details
   * @param {string} id
   */
  async findById(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }
    return Listing.findById(id)
      .populate('assetId')
      .populate('sellerId', 'name email trustScore kycStatus accountStatus');
  }

  /**
   * Find one listing matching filter
   * @param {object} filter
   */
  async findOne(filter) {
    return Listing.findOne(filter);
  }

  /**
   * Create a new listing document
   * @param {object} data
   */
  async create(data) {
    const listing = await Listing.create(data);
    return this.findById(listing._id);
  }

  /**
   * Update listing by ID
   * @param {string} id
   * @param {object} updateData
   */
  async updateById(id, updateData) {
    return Listing.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate('assetId')
      .populate('sellerId', 'name email trustScore kycStatus accountStatus');
  }

  /**
   * Delete listing by ID
   * @param {string} id
   */
  async deleteById(id) {
    return Listing.findByIdAndDelete(id);
  }

  /**
   * Advanced listing search with multi-field filtering, asset metadata lookup,
   * pagination, and flexible sorting.
   *
   * Filters supported:
   * - assetType: Train, Bus, Event pass, etc.
   * - source: Origin station or city (case-insensitive substring match)
   * - destination: Destination station or city (case-insensitive substring match)
   * - date: Travel date (journeyDate / departureDate / eventDate)
   * - minPrice / maxPrice: Asking price range
   * - verificationStatus: Asset verification status (VERIFIED, etc.)
   * - status: Listing state (DRAFT, ACTIVE, RESERVED, SOLD, CANCELLED, EXPIRED, SUSPENDED, or all)
   * - sellerId: Specific seller filter
   * - sortBy: askingPrice | price | createdAt | expiresAt | date | journeyDate
   * - sortOrder: asc | desc
   * - page, limit
   *
   * @param {object} query
   * @returns {Promise<{ items: Array, total: number, page: number, limit: number, totalPages: number }>}
   */
  async list(query = {}) {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const pipeline = [];

    // 1. Initial Listing match criteria
    const listingMatch = {};

    // Status filter: default to ACTIVE for public browse, unless specific or 'all' requested
    if (query.status && query.status !== 'all') {
      listingMatch.status = query.status;
    } else if (!query.status) {
      listingMatch.status = ListingStatus.ACTIVE;
    }

    // Price range filtering on askingPrice
    const minPrice =
      query.minPrice !== undefined && query.minPrice !== '' ? Number(query.minPrice) : null;
    const maxPrice =
      query.maxPrice !== undefined && query.maxPrice !== '' ? Number(query.maxPrice) : null;

    if (minPrice !== null || maxPrice !== null) {
      listingMatch.askingPrice = {};
      if (minPrice !== null && !isNaN(minPrice)) listingMatch.askingPrice.$gte = minPrice;
      if (maxPrice !== null && !isNaN(maxPrice)) listingMatch.askingPrice.$lte = maxPrice;
    }

    if (query.sellerId && mongoose.Types.ObjectId.isValid(query.sellerId)) {
      listingMatch.sellerId = new mongoose.Types.ObjectId(query.sellerId);
    }

    pipeline.push({ $match: listingMatch });

    // 2. Join with Asset collection
    pipeline.push({
      $lookup: {
        from: 'assets',
        localField: 'assetId',
        foreignField: '_id',
        as: 'asset',
      },
    });
    pipeline.push({ $unwind: '$asset' });

    // 3. Match Asset-specific filters
    const assetMatch = {};

    // Filter by assetType
    if (query.assetType) {
      assetMatch['asset.assetType'] = query.assetType.toUpperCase();
    }

    // Filter by asset verificationStatus
    if (query.verificationStatus) {
      assetMatch['asset.verificationStatus'] = query.verificationStatus.toUpperCase();
    }

    // Filter by source / origin
    if (query.source) {
      const sourceRegex = new RegExp(escapeRegex(query.source.trim()), 'i');
      assetMatch.$or = [
        { 'asset.metadata.source': sourceRegex },
        { 'asset.metadata.fromStation': sourceRegex },
        { 'asset.metadata.from': sourceRegex },
        { 'asset.title': sourceRegex },
      ];
    }

    // Filter by destination
    if (query.destination) {
      const destRegex = new RegExp(escapeRegex(query.destination.trim()), 'i');
      const destConditions = [
        { 'asset.metadata.destination': destRegex },
        { 'asset.metadata.toStation': destRegex },
        { 'asset.metadata.to': destRegex },
        { 'asset.title': destRegex },
      ];
      if (assetMatch.$or) {
        assetMatch.$and = [{ $or: assetMatch.$or }, { $or: destConditions }];
        delete assetMatch.$or;
      } else {
        assetMatch.$or = destConditions;
      }
    }

    // Filter by travel / journey / event date
    if (query.date) {
      const dateStr = query.date.trim();
      const dateRegex = new RegExp(`^${escapeRegex(dateStr)}`, 'i');
      const dateConditions = [
        { 'asset.metadata.journeyDate': dateRegex },
        { 'asset.metadata.departureDate': dateRegex },
        { 'asset.metadata.eventDate': dateRegex },
        { 'asset.metadata.date': dateRegex },
      ];
      if (assetMatch.$and) {
        assetMatch.$and.push({ $or: dateConditions });
      } else if (assetMatch.$or) {
        assetMatch.$and = [{ $or: assetMatch.$or }, { $or: dateConditions }];
        delete assetMatch.$or;
      } else {
        assetMatch.$or = dateConditions;
      }
    }

    if (Object.keys(assetMatch).length > 0) {
      pipeline.push({ $match: assetMatch });
    }

    // 4. Join with Seller (User) collection with sanitized fields
    pipeline.push({
      $lookup: {
        from: 'users',
        localField: 'sellerId',
        foreignField: '_id',
        as: 'seller',
        pipeline: [
          {
            $project: {
              name: 1,
              email: 1,
              trustScore: 1,
              kycStatus: 1,
              accountStatus: 1,
              isVerified: { $eq: ['$kycStatus', 'VERIFIED'] },
            },
          },
        ],
      },
    });
    pipeline.push({
      $unwind: { path: '$seller', preserveNullAndEmptyArrays: true },
    });

    // 5. Sorting
    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = (query.sortOrder || 'desc').toLowerCase() === 'asc' ? 1 : -1;
    let sortField = 'createdAt';

    if (sortBy === 'price' || sortBy === 'askingPrice') {
      sortField = 'askingPrice';
    } else if (sortBy === 'expiresAt') {
      sortField = 'expiresAt';
    } else if (sortBy === 'date' || sortBy === 'journeyDate') {
      sortField = 'asset.metadata.journeyDate';
    }

    pipeline.push({ $sort: { [sortField]: sortOrder, _id: sortOrder } });

    // 6. Project clean structure (mapping asset and seller back to assetId and sellerId)
    pipeline.push({
      $project: {
        _id: 1,
        assetId: '$asset',
        sellerId: '$seller',
        askingPrice: 1,
        price: '$askingPrice',
        originalFaceValue: 1,
        currency: 1,
        status: 1,
        isEscrowProtected: 1,
        expiresAt: 1,
        notes: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    });

    // 7. Faceted execution for count + paginated items
    pipeline.push({
      $facet: {
        metadata: [{ $count: 'total' }],
        data: [{ $skip: skip }, { $limit: limit }],
      },
    });

    const [result] = await Listing.aggregate(pipeline);
    const total = result?.metadata?.[0]?.total || 0;
    const items = result?.data || [];

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }
}

export const listingRepository = new ListingRepository();
