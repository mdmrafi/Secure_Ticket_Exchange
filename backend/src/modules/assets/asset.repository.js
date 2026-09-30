import { Asset } from './asset.model.js';

export class AssetRepository {
  async findById(id) {
    return Asset.findById(id).populate('ownerId', 'name email trustScore isVerified');
  }

  async findByOwner(ownerId, filter = {}) {
    return Asset.find({ ownerId, ...filter }).sort({ createdAt: -1 });
  }

  async findByIdentifier(assetType, uniqueAssetIdentifier) {
    return Asset.findOne({ assetType, uniqueAssetIdentifier });
  }

  async create(data) {
    return Asset.create(data);
  }

  async updateById(id, updateData) {
    return Asset.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
  }

  async list(filter = {}, pagination = { skip: 0, limit: 20 }) {
    const [items, total] = await Promise.all([
      Asset.find(filter)
        .populate('ownerId', 'name email trustScore')
        .skip(pagination.skip)
        .limit(pagination.limit)
        .sort({ createdAt: -1 }),
      Asset.countDocuments(filter),
    ]);

    return { items, total };
  }
}

export const assetRepository = new AssetRepository();
