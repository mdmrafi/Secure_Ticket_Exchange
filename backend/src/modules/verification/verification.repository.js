import { Verification } from './verification.model.js';

export class VerificationRepository {
  async findById(id) {
    return Verification.findById(id).populate('assetId').populate('requestedBy', 'name email');
  }

  async findByAssetId(assetId) {
    return Verification.findOne({ assetId }).sort({ createdAt: -1 });
  }

  async create(data) {
    return Verification.create(data);
  }

  async updateById(id, updateData) {
    return Verification.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
  }

  async list(filter = {}, pagination = { skip: 0, limit: 20 }) {
    const [items, total] = await Promise.all([
      Verification.find(filter)
        .populate('assetId')
        .populate('requestedBy', 'name email')
        .skip(pagination.skip)
        .limit(pagination.limit)
        .sort({ createdAt: -1 }),
      Verification.countDocuments(filter),
    ]);

    return { items, total };
  }
}

export const verificationRepository = new VerificationRepository();
