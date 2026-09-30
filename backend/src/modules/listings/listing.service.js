import { listingRepository } from './listing.repository.js';
import { assetRepository } from '../assets/asset.repository.js';
import { NotFoundError, ForbiddenError } from '../../common/errors/index.js';
import { AssetStatus, ListingStatus } from '../../common/constants/asset-types.constant.js';

export class ListingService {
  constructor(repo = listingRepository, assetRepo = assetRepository) {
    this.repo = repo;
    this.assetRepo = assetRepo;
  }

  async createListing(sellerId, data) {
    const asset = await this.assetRepo.findById(data.assetId);
    if (!asset) {
      throw new NotFoundError('Asset not found');
    }

    if (asset.ownerId._id.toString() !== sellerId.toString()) {
      throw new ForbiddenError('You can only list assets that you own');
    }

    const listing = await this.repo.create({
      ...data,
      sellerId,
      originalFaceValue: asset.originalValue || data.price,
    });

    await this.assetRepo.updateById(asset._id, { status: AssetStatus.LISTED });

    return listing;
  }

  async getListingById(id) {
    const listing = await this.repo.findById(id);
    if (!listing) {
      throw new NotFoundError('Listing not found');
    }
    return listing;
  }

  async listActiveListings(query = {}) {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const filter = { status: ListingStatus.ACTIVE };

    const { items, total } = await this.repo.list(filter, { skip, limit });

    return {
      listings: items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

export const listingService = new ListingService();
