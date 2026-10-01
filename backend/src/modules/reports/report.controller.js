import { reportService } from './report.service.js';
import { ApiResponse } from '../../common/utils/api-response.js';
import { asyncHandler } from '../../common/utils/async-handler.js';

export class ReportController {
  constructor(service = reportService) {
    this.service = service;
  }

  create = asyncHandler(async (req, res) => {
    const report = await this.service.createReport(req.user.userId, req.body);
    return ApiResponse.created(res, report, 'Report submitted successfully');
  });

  getById = asyncHandler(async (req, res) => {
    const report = await this.service.getReportById(req.params.id, req.user);
    return ApiResponse.success(res, report, 'Report retrieved');
  });
}

export const reportController = new ReportController();
