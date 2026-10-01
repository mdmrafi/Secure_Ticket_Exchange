import { adminService } from './admin.service.js';
import { ApiResponse } from '../../common/utils/api-response.js';
import { asyncHandler } from '../../common/utils/async-handler.js';

export class AdminController {
  constructor(service = adminService) {
    this.service = service;
  }

  // =========================================================================
  // DASHBOARD APIS
  // =========================================================================

  getOverview = asyncHandler(async (req, res) => {
    const metrics = await this.service.getPlatformOverview();
    return ApiResponse.success(res, metrics, 'Admin platform metrics retrieved');
  });

  // 1. Users
  listUsers = asyncHandler(async (req, res) => {
    const result = await this.service.listUsers(req.query);
    return ApiResponse.success(res, result, 'Users retrieved successfully');
  });

  getUserDetails = asyncHandler(async (req, res) => {
    const result = await this.service.getUserDetails(req.params.id);
    return ApiResponse.success(res, result, 'User details retrieved successfully');
  });

  // 2. KYC Reviews
  listKYCReviews = asyncHandler(async (req, res) => {
    const result = await this.service.listKYCReviews(req.query);
    return ApiResponse.success(res, result, 'KYC reviews retrieved successfully');
  });

  getKYCDetails = asyncHandler(async (req, res) => {
    const result = await this.service.getKYCDetails(req.params.id);
    return ApiResponse.success(res, result, 'KYC details retrieved successfully');
  });

  // 3. Assets
  listAssets = asyncHandler(async (req, res) => {
    const result = await this.service.listAssets(req.query);
    return ApiResponse.success(res, result, 'Assets retrieved successfully');
  });

  getAssetDetails = asyncHandler(async (req, res) => {
    const result = await this.service.getAssetDetails(req.params.id);
    return ApiResponse.success(res, result, 'Asset details retrieved successfully');
  });

  // 4. Listings
  listListings = asyncHandler(async (req, res) => {
    const result = await this.service.listListings(req.query);
    return ApiResponse.success(res, result, 'Listings retrieved successfully');
  });

  getListingDetails = asyncHandler(async (req, res) => {
    const result = await this.service.getListingDetails(req.params.id);
    return ApiResponse.success(res, result, 'Listing details retrieved successfully');
  });

  // 5. Transactions
  listTransactions = asyncHandler(async (req, res) => {
    const result = await this.service.listTransactions(req.query);
    return ApiResponse.success(res, result, 'Transactions retrieved successfully');
  });

  getTransactionDetails = asyncHandler(async (req, res) => {
    const result = await this.service.getTransactionDetails(req.params.id);
    return ApiResponse.success(res, result, 'Transaction details retrieved successfully');
  });

  // 6. Reports
  listReports = asyncHandler(async (req, res) => {
    const result = await this.service.listReports(req.query);
    return ApiResponse.success(res, result, 'Reports retrieved successfully');
  });

  getReportDetails = asyncHandler(async (req, res) => {
    const result = await this.service.getReportDetails(req.params.id);
    return ApiResponse.success(res, result, 'Report details retrieved successfully');
  });

  // 7. Fraud Alerts
  listFraudAlerts = asyncHandler(async (req, res) => {
    const result = await this.service.listFraudAlerts(req.query);
    return ApiResponse.success(res, result, 'Fraud alerts retrieved successfully');
  });

  getFraudAlertDetails = asyncHandler(async (req, res) => {
    const result = await this.service.getFraudAlertDetails(req.params.id);
    return ApiResponse.success(res, result, 'Fraud alert details retrieved successfully');
  });

  // 8. Audit Logs
  listAuditLogs = asyncHandler(async (req, res) => {
    const result = await this.service.listAuditLogs(req.query);
    return ApiResponse.success(res, result, 'Audit logs retrieved successfully');
  });

  getAuditLogDetails = asyncHandler(async (req, res) => {
    const result = await this.service.getAuditLogDetails(req.params.id);
    return ApiResponse.success(res, result, 'Audit log details retrieved successfully');
  });

  // Verifications queue
  listVerifications = asyncHandler(async (req, res) => {
    const result = await this.service.listVerifications(req.query);
    return ApiResponse.success(res, result, 'Verification reviews retrieved successfully');
  });

  // =========================================================================
  // ADMIN MODERATION ACTIONS
  // =========================================================================

  suspendUser = asyncHandler(async (req, res) => {
    const result = await this.service.suspendUser(req.params.id, req.user, req.body.reason);
    return ApiResponse.success(res, result, 'User suspended successfully');
  });

  unsuspendUser = asyncHandler(async (req, res) => {
    const result = await this.service.unsuspendUser(req.params.id, req.user, req.body.reason);
    return ApiResponse.success(res, result, 'User unsuspended successfully');
  });

  suspendListing = asyncHandler(async (req, res) => {
    const result = await this.service.suspendListing(req.params.id, req.user, req.body.reason);
    return ApiResponse.success(res, result, 'Listing suspended successfully');
  });

  approveManualVerification = asyncHandler(async (req, res) => {
    const result = await this.service.approveManualVerification(req.params.id, req.user, req.body);
    return ApiResponse.success(res, result, 'Verification approved successfully');
  });

  rejectVerification = asyncHandler(async (req, res) => {
    const result = await this.service.rejectVerification(req.params.id, req.user, req.body);
    return ApiResponse.success(res, result, 'Verification rejected successfully');
  });

  resolveReport = asyncHandler(async (req, res) => {
    const result = await this.service.resolveReport(req.params.id, req.user, req.body);
    return ApiResponse.success(res, result, 'Report resolved successfully');
  });

  freezeTransaction = asyncHandler(async (req, res) => {
    const result = await this.service.freezeTransaction(req.params.id, req.user, req.body.reason);
    return ApiResponse.success(res, result, 'Transaction frozen and escrow secured');
  });
}

export const adminController = new AdminController();
