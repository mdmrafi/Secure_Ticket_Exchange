import { FraudAssessment } from './fraud-assessment.model.js';

export class FraudRepository {
  /**
   * Create a new fraud assessment record
   * @param {object} data
   */
  async create(data) {
    return FraudAssessment.create(data);
  }

  /**
   * Find assessment by ID with populated references
   * @param {string} id
   */
  async findById(id) {
    return FraudAssessment.findById(id)
      .populate('assetId')
      .populate('userId', 'name fullName email role trustScore accountStatus')
      .populate('reviewDecision.reviewedBy', 'name fullName email role')
      .exec();
  }

  /**
   * Query assessments with pagination, filtering, and sorting
   * @param {object} filter
   * @param {object} [options]
   */
  async find(filter = {}, options = {}) {
    const { page = 1, limit = 20, sort = { timestamp: -1 } } = options;
    const skip = (page - 1) * limit;

    const [assessments, total] = await Promise.all([
      FraudAssessment.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('assetId', 'title assetType uniqueAssetIdentifier status verificationStatus')
        .populate('userId', 'name fullName email trustScore')
        .populate('reviewDecision.reviewedBy', 'name fullName email')
        .exec(),
      FraudAssessment.countDocuments(filter),
    ]);

    return {
      assessments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update assessment by ID
   * @param {string} id
   * @param {object} updateData
   */
  async updateById(id, updateData) {
    return FraudAssessment.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    )
      .populate('assetId')
      .populate('userId', 'name fullName email trustScore')
      .populate('reviewDecision.reviewedBy', 'name fullName email')
      .exec();
  }

  /**
   * Find latest assessment for a given target
   * @param {string} targetType
   * @param {string} targetId
   */
  async findLatestByTarget(targetType, targetId) {
    return FraudAssessment.findOne({ targetType, targetId })
      .sort({ timestamp: -1 })
      .populate('assetId')
      .populate('userId')
      .exec();
  }
}

export const fraudRepository = new FraudRepository();
