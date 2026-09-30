import { Listing } from './listing.model.js';

export class ListingRepository {
  async findById(id) {
    return Listing.findById(id)
      .populate('assetId')
      .populate('sellerId', 'name email trustScore isVerified');
  }

  async create(data) {
    return Listing.create(data);
  }

  async updateById(id, updateData) {
    return Listing.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
  }

  async list(filter = {}, pagination = { skip: 0, limit: 20 }) {
    const [items, total] = await Promise.all([
      Listing.find(filter)
        .populate('assetId')
        .populate('sellerId', 'name email trustScore isVerified')
        .skip(pagination.skip)
        .limit(pagination.limit)
        .sort({ createdAt: -1 }),
      Listing.countDocuments(filter),
    ]);

    return { items, total };
  }
}

export const listingRepository = new ListingRepository();
