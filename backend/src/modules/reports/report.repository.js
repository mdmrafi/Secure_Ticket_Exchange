import { Report } from './report.model.js';

export class ReportRepository {
  async findById(id) {
    return Report.findById(id).populate('reporterId', 'name email');
  }

  async create(data) {
    return Report.create(data);
  }

  async updateById(id, updateData) {
    return Report.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
  }

  async list(filter = {}, pagination = { skip: 0, limit: 20 }) {
    const [items, total] = await Promise.all([
      Report.find(filter)
        .populate('reporterId', 'name email')
        .skip(pagination.skip)
        .limit(pagination.limit)
        .sort({ createdAt: -1 }),
      Report.countDocuments(filter),
    ]);

    return { items, total };
  }
}

export const reportRepository = new ReportRepository();
