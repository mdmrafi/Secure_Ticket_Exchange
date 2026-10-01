import { reportRepository } from './report.repository.js';
import { NotFoundError } from '../../common/errors/index.js';
import { publishEvent } from '../../jobs/publisher.js';
import { EventNames } from '../../common/constants/events.constant.js';

export class ReportService {
  constructor(repo = reportRepository) {
    this.repo = repo;
  }

  async createReport(reporterId, data) {
    const report = await this.repo.create({
      ...data,
      reporterId,
    });

    // Asynchronously dispatch report.created event for background jobs
    publishEvent(
      EventNames.REPORT_CREATED,
      {
        reportId: report._id.toString(),
        reporterId: reporterId.toString(),
        targetId: report.targetId?.toString(),
        targetType: report.targetType,
        category: report.category,
        reason: report.reason,
      },
      { id: reporterId.toString() }
    ).catch(() => {});

    return report;
  }

  async getReportById(id) {
    const report = await this.repo.findById(id);
    if (!report) {
      throw new NotFoundError('Report not found');
    }
    return report;
  }

  async listReports(query = {}) {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const filter = {};
    if (query.status) filter.status = query.status;
    if (query.category) filter.category = query.category;

    const { items, total } = await this.repo.list(filter, { skip, limit });

    return {
      reports: items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

export const reportService = new ReportService();
