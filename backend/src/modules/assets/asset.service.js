import { assetRepository } from './asset.repository.js';
import { NotFoundError, ConflictError } from '../../common/errors/index.js';

export class AssetService {
  constructor(repo = assetRepository) {
    this.repo = repo;
  }

  async createAsset(ownerId, assetData) {
    // Check if unique identifier already exists for this asset type
    const existing = await this.repo.findByIdentifier(assetData.assetType, assetData.uniqueAssetIdentifier);
    if (existing) {
      throw new ConflictError('An asset with this unique identifier is already registered in the system');
    }

    return this.repo.create({
      ...assetData,
      ownerId,
    });
  }

  async getAssetById(id) {
    const asset = await this.repo.findById(id);
    if (!asset) {
      throw new NotFoundError('Asset not found');
    }
    return asset;
  }

  async getMyAssets(ownerId, query = {}) {
    return this.repo.findByOwner(ownerId, query);
  }

  async listAssets(query = {}) {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const filter = {};
    if (query.assetType) filter.assetType = query.assetType;
    if (query.status) filter.status = query.status;

    const { items, total } = await this.repo.list(filter, { skip, limit });

    return {
      assets: items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

export const assetService = new AssetService();
