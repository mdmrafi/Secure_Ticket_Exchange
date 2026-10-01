import { fraudService } from './fraud.service.js';
import { ApiResponse } from '../../common/utils/api-response.js';
import { asyncHandler } from '../../common/utils/async-handler.js';

export class FraudController {
  constructor(service = fraudService) {
    this.service = service;
  }

  /**
   * List fraud assessments with filtering
   * GET /api/v1/admin/fraud/assessments
   */
  getAssessments = asyncHandler(async (req, res) => {
    const filter = {};
    if (req.query.riskLevel) filter.riskLevel = req.query.riskLevel;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.targetType) filter.targetType = req.query.targetType;

    const options = {
      page: parseInt(req.query.page || '1', 10),
      limit: parseInt(req.query.limit || '20', 10),
    };

    const result = await this.service.getAssessments(filter, options);
    return ApiResponse.success(res, result, 'Fraud assessments retrieved');
  });

  /**
   * Get single assessment by ID
   * GET /api/v1/admin/fraud/assessments/:id
   */
  getAssessmentById = asyncHandler(async (req, res) => {
    const assessment = await this.service.getAssessmentById(req.params.id);
    return ApiResponse.success(res, assessment, 'Fraud assessment details retrieved');
  });

  /**
   * Review and resolve a fraud assessment
   * POST /api/v1/admin/fraud/assessments/:id/review
   */
  reviewAssessment = asyncHandler(async (req, res) => {
    const updated = await this.service.reviewAssessment(req.params.id, req.user.userId, req.body);
    return ApiResponse.success(res, updated, 'Fraud assessment reviewed and resolved');
  });

  /**
   * Trigger on-demand assessment for an asset
   * POST /api/v1/admin/fraud/assess
   */
  triggerAssessment = asyncHandler(async (req, res) => {
    const assessment = await this.service.assessAsset(req.body.assetId, req.body.context || {});
    return ApiResponse.created(res, assessment, 'Asset fraud evaluation completed');
  });
}

export const fraudController = new FraudController();
