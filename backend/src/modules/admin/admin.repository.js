import { User } from '../users/user.model.js';
import { KYCRecord } from '../kyc/kyc.model.js';
import { Asset } from '../assets/asset.model.js';
import { Listing } from '../listings/listing.model.js';
import { Transaction } from '../transactions/transaction.model.js';
import { Report } from '../reports/report.model.js';
import { FraudAssessment } from '../fraud/fraud-assessment.model.js';
import { AuditLog } from '../audit/audit-log.model.js';
import { Verification } from '../verification/verification.model.js';

export class AdminRepository {
  /**
   * Platform Overview Metrics
   */
  async getPlatformMetrics() {
    const [
      totalUsers,
      totalAssets,
      activeListings,
      totalTransactions,
      pendingReports,
      pendingKYC,
      manualVerifications,
      highRiskFraud,
    ] = await Promise.all([
      User.countDocuments(),
      Asset.countDocuments(),
      Listing.countDocuments({ status: 'ACTIVE' }),
      Transaction.countDocuments(),
      Report.countDocuments({ status: 'PENDING' }),
      KYCRecord.countDocuments({ status: { $in: ['PENDING', 'MANUAL_REVIEW'] } }),
      Verification.countDocuments({ status: { $in: ['SUBMITTED', 'MANUAL_REVIEW', 'PROCESSING'] } }),
      FraudAssessment.countDocuments({ riskLevel: { $in: ['HIGH', 'CRITICAL'] } }),
    ]);

    return {
      totalUsers,
      totalAssets,
      activeListings,
      totalTransactions,
      pendingReports,
      pendingKYC,
      manualVerifications,
      highRiskFraud,
    };
  }

  /**
   * 1. Users Dashboard Query
   */
  async listUsers(filter = {}, { skip = 0, limit = 20, sort = { createdAt: -1 } } = {}) {
    const [items, total] = await Promise.all([
      User.find(filter).select('-passwordHash').sort(sort).skip(skip).limit(limit),
      User.countDocuments(filter),
    ]);
    return { items, total };
  }

  async getUserById(id) {
    return User.findById(id).select('-passwordHash');
  }

  /**
   * 2. KYC Reviews Dashboard Query
   */
  async listKYCReviews(filter = {}, { skip = 0, limit = 20, sort = { updatedAt: -1 } } = {}) {
    const [items, total] = await Promise.all([
      KYCRecord.find(filter)
        .populate('userId', 'name email phone accountStatus role kycStatus trustScore')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      KYCRecord.countDocuments(filter),
    ]);
    return { items, total };
  }

  async getKYCById(id) {
    return KYCRecord.findById(id).populate(
      'userId',
      'name email phone accountStatus role kycStatus trustScore'
    );
  }

  /**
   * 3. Assets Dashboard Query
   */
  async listAssets(filter = {}, { skip = 0, limit = 20, sort = { createdAt: -1 } } = {}) {
    const [items, total] = await Promise.all([
      Asset.find(filter)
        .populate('ownerId', 'name email accountStatus role')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Asset.countDocuments(filter),
    ]);
    return { items, total };
  }

  async getAssetById(id) {
    return Asset.findById(id).populate('ownerId', 'name email accountStatus role');
  }

  /**
   * 4. Listings Dashboard Query
   */
  async listListings(filter = {}, { skip = 0, limit = 20, sort = { createdAt: -1 } } = {}) {
    const [items, total] = await Promise.all([
      Listing.find(filter)
        .populate('sellerId', 'name email accountStatus')
        .populate('assetId', 'title assetType uniqueAssetIdentifier status verificationStatus')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Listing.countDocuments(filter),
    ]);
    return { items, total };
  }

  async getListingById(id) {
    return Listing.findById(id)
      .populate('sellerId', 'name email accountStatus')
      .populate('assetId', 'title assetType uniqueAssetIdentifier status verificationStatus');
  }

  /**
   * 5. Transactions Dashboard Query
   */
  async listTransactions(filter = {}, { skip = 0, limit = 20, sort = { createdAt: -1 } } = {}) {
    const [items, total] = await Promise.all([
      Transaction.find(filter)
        .populate('buyerId', 'name email')
        .populate('sellerId', 'name email')
        .populate('listingId', 'askingPrice currency status')
        .populate('assetId', 'title assetType uniqueAssetIdentifier')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Transaction.countDocuments(filter),
    ]);
    return { items, total };
  }

  async getTransactionById(id) {
    return Transaction.findById(id)
      .populate('buyerId', 'name email')
      .populate('sellerId', 'name email')
      .populate('listingId', 'askingPrice currency status')
      .populate('assetId', 'title assetType uniqueAssetIdentifier');
  }

  /**
   * 6. Reports Dashboard Query
   */
  async listReports(filter = {}, { skip = 0, limit = 20, sort = { createdAt: -1 } } = {}) {
    const [items, total] = await Promise.all([
      Report.find(filter)
        .populate('reporterId', 'name email')
        .populate('assignedAdminId', 'name email')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Report.countDocuments(filter),
    ]);
    return { items, total };
  }

  async getReportById(id) {
    return Report.findById(id)
      .populate('reporterId', 'name email')
      .populate('assignedAdminId', 'name email');
  }

  /**
   * 7. Fraud Alerts Dashboard Query
   */
  async listFraudAlerts(filter = {}, { skip = 0, limit = 20, sort = { createdAt: -1 } } = {}) {
    const [items, total] = await Promise.all([
      FraudAssessment.find(filter)
        .populate('userId', 'name email accountStatus trustScore')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      FraudAssessment.countDocuments(filter),
    ]);
    return { items, total };
  }

  async getFraudAlertById(id) {
    return FraudAssessment.findById(id).populate('userId', 'name email accountStatus trustScore');
  }

  /**
   * 8. Audit Logs Dashboard Query
   */
  async listAuditLogs(filter = {}, { skip = 0, limit = 20, sort = { timestamp: -1 } } = {}) {
    const [items, total] = await Promise.all([
      AuditLog.find(filter).sort(sort).skip(skip).limit(limit),
      AuditLog.countDocuments(filter),
    ]);
    return { items, total };
  }

  async getAuditLogById(id) {
    return AuditLog.findById(id);
  }

  /**
   * Verifications Query (for manual reviews)
   */
  async listVerifications(filter = {}, { skip = 0, limit = 20, sort = { createdAt: -1 } } = {}) {
    const [items, total] = await Promise.all([
      Verification.find(filter)
        .populate('assetId', 'title assetType uniqueAssetIdentifier ownerId status')
        .populate('requestedBy', 'name email')
        .populate('verifierId', 'name email')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Verification.countDocuments(filter),
    ]);
    return { items, total };
  }

  async getVerificationById(id) {
    return Verification.findById(id)
      .populate('assetId')
      .populate('requestedBy', 'name email')
      .populate('verifierId', 'name email');
  }
}

export const adminRepository = new AdminRepository();
