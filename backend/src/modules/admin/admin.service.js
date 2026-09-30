import { adminRepository } from './admin.repository.js';
import { reportRepository } from '../reports/report.repository.js';
import { NotFoundError } from '../../common/errors/index.js';

export class AdminService {
  constructor(repo = adminRepository, reportRepo = reportRepository) {
    this.repo = repo;
    this.reportRepo = reportRepo;
  }

  async getPlatformOverview() {
    return this.repo.getPlatformMetrics();
  }

  async resolveReport(reportId, adminId, resolution) {
    const report = await this.reportRepo.findById(reportId);
    if (!report) {
      throw new NotFoundError('Report not found');
    }

    return this.reportRepo.updateById(reportId, {
      status: resolution.status,
      assignedAdminId: adminId,
      resolutionNotes: resolution.notes,
    });
  }
}

export const adminService = new AdminService();
