import { adminService } from './admin.service.js';
import { ApiResponse } from '../../common/utils/api-response.js';
import { asyncHandler } from '../../common/utils/async-handler.js';

export class AdminController {
  constructor(service = adminService) {
    this.service = service;
  }

  getOverview = asyncHandler(async (req, res) => {
    const metrics = await this.service.getPlatformOverview();
    return ApiResponse.success(res, metrics, 'Admin platform metrics retrieved');
  });

  resolveReport = asyncHandler(async (req, res) => {
    const updated = await this.service.resolveReport(req.params.id, req.user.userId, req.body);
    return ApiResponse.success(res, updated, 'Report resolution recorded');
  });
}

export const adminController = new AdminController();
