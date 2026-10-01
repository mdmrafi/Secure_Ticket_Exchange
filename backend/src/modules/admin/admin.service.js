import crypto from 'crypto';
import { adminRepository } from './admin.repository.js';
import { User } from '../users/user.model.js';
import { Asset } from '../assets/asset.model.js';
import { Listing } from '../listings/listing.model.js';
import { Reservation, ReservationStatus } from '../listings/reservation.model.js';
import { Transaction } from '../transactions/transaction.model.js';
import { TransactionEvent, TransactionEventType } from '../transactions/transaction-event.model.js';
import { Verification } from '../verification/verification.model.js';
import { Report } from '../reports/report.model.js';
import { RefreshToken } from '../auth/refresh-token.model.js';
import { auditService } from '../audit/audit.service.js';
import { notificationService } from '../notifications/notification.service.js';
import { publishEvent } from '../../jobs/publisher.js';
import { EventNames } from '../../common/constants/events.constant.js';
import {
  ListingStatus,
  AssetStatus,
  VerificationStatus,
  TransactionStatus,
} from '../../common/constants/asset-types.constant.js';
import { NotFoundError, BadRequestError, ForbiddenError } from '../../common/errors/index.js';
import { logger } from '../../config/logger.config.js';

export class AdminService {
  constructor(repo = adminRepository) {
    this.repo = repo;
  }

  /**
   * Helper: Pagination formatter
   */
  formatPaginated(items, total, page, limit) {
    const p = Math.max(1, parseInt(page, 10) || 1);
    const l = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    return {
      items,
      pagination: {
        page: p,
        limit: l,
        total,
        totalPages: Math.ceil(total / l),
      },
    };
  }

  // =========================================================================
  // DASHBOARD APIS (OBSERVABILITY & MONITORING)
  // =========================================================================

  async getPlatformOverview() {
    return this.repo.getPlatformMetrics();
  }

  /**
   * 1. Users Dashboard Query
   */
  async listUsers(query = {}) {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const filter = {};
    if (query.role) filter.role = query.role;
    if (query.accountStatus) filter.accountStatus = query.accountStatus;
    if (query.kycStatus) filter.kycStatus = query.kycStatus;
    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { email: { $regex: query.search, $options: 'i' } },
      ];
    }

    const { items, total } = await this.repo.listUsers(filter, { skip, limit });
    return this.formatPaginated(items, total, page, limit);
  }

  async getUserDetails(id) {
    const user = await this.repo.getUserById(id);
    if (!user) throw new NotFoundError('User not found');

    const [assetsCount, listingsCount, transactionsCount] = await Promise.all([
      Asset.countDocuments({ ownerId: id }),
      Listing.countDocuments({ sellerId: id }),
      Transaction.countDocuments({ $or: [{ buyerId: id }, { sellerId: id }] }),
    ]);

    return {
      user,
      activity: {
        assetsCount,
        listingsCount,
        transactionsCount,
      },
    };
  }

  /**
   * 2. KYC Reviews Dashboard Query
   */
  async listKYCReviews(query = {}) {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const filter = {};
    if (query.status) filter.status = query.status;
    if (query.documentType) filter.documentType = query.documentType;
    if (query.verificationLevel) filter.verificationLevel = query.verificationLevel;

    const { items, total } = await this.repo.listKYCReviews(filter, { skip, limit });
    return this.formatPaginated(items, total, page, limit);
  }

  async getKYCDetails(id) {
    const record = await this.repo.getKYCById(id);
    if (!record) throw new NotFoundError('KYC record not found');
    return record;
  }

  /**
   * 3. Assets Dashboard Query
   */
  async listAssets(query = {}) {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const filter = {};
    if (query.status) filter.status = query.status;
    if (query.verificationStatus) filter.verificationStatus = query.verificationStatus;
    if (query.assetType) filter.assetType = query.assetType;
    if (query.ownerId) filter.ownerId = query.ownerId;
    if (query.search) {
      filter.$or = [
        { title: { $regex: query.search, $options: 'i' } },
        { uniqueAssetIdentifier: { $regex: query.search, $options: 'i' } },
      ];
    }

    const { items, total } = await this.repo.listAssets(filter, { skip, limit });
    return this.formatPaginated(items, total, page, limit);
  }

  async getAssetDetails(id) {
    const asset = await this.repo.getAssetById(id);
    if (!asset) throw new NotFoundError('Asset not found');

    const verifications = await Verification.find({ assetId: id }).sort({ createdAt: -1 });
    return { asset, verifications };
  }

  /**
   * 4. Listings Dashboard Query
   */
  async listListings(query = {}) {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const filter = {};
    if (query.status) filter.status = query.status;
    if (query.sellerId) filter.sellerId = query.sellerId;

    const { items, total } = await this.repo.listListings(filter, { skip, limit });
    return this.formatPaginated(items, total, page, limit);
  }

  async getListingDetails(id) {
    const listing = await this.repo.getListingById(id);
    if (!listing) throw new NotFoundError('Listing not found');

    const activeReservation = await Reservation.findOne({
      listingId: id,
      status: ReservationStatus.ACTIVE,
    }).populate('buyerId', 'name email');

    return { listing, activeReservation };
  }

  /**
   * 5. Transactions Dashboard Query
   */
  async listTransactions(query = {}) {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const filter = {};
    if (query.transactionStatus) filter.transactionStatus = query.transactionStatus;
    if (query.paymentStatus) filter.paymentStatus = query.paymentStatus;
    if (query.escrowStatus) filter.escrowStatus = query.escrowStatus;
    if (query.buyerId) filter.buyerId = query.buyerId;
    if (query.sellerId) filter.sellerId = query.sellerId;

    const { items, total } = await this.repo.listTransactions(filter, { skip, limit });
    return this.formatPaginated(items, total, page, limit);
  }

  async getTransactionDetails(id) {
    const transaction = await this.repo.getTransactionById(id);
    if (!transaction) throw new NotFoundError('Transaction not found');

    const events = await TransactionEvent.find({ transactionId: id }).sort({ timestamp: -1 });
    return { transaction, events };
  }

  /**
   * 6. Reports Dashboard Query
   */
  async listReports(query = {}) {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const filter = {};
    if (query.status) filter.status = query.status;
    if (query.category) filter.category = query.category;
    if (query.targetType) filter.targetType = query.targetType;

    const { items, total } = await this.repo.listReports(filter, { skip, limit });
    return this.formatPaginated(items, total, page, limit);
  }

  async getReportDetails(id) {
    const report = await this.repo.getReportById(id);
    if (!report) throw new NotFoundError('Report not found');
    return report;
  }

  /**
   * 7. Fraud Alerts Dashboard Query
   */
  async listFraudAlerts(query = {}) {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const filter = {};
    if (query.riskLevel) filter.riskLevel = query.riskLevel;
    if (query.status) filter.status = query.status;
    if (query.targetType) filter.targetType = query.targetType;

    const { items, total } = await this.repo.listFraudAlerts(filter, { skip, limit });
    return this.formatPaginated(items, total, page, limit);
  }

  async getFraudAlertDetails(id) {
    const alert = await this.repo.getFraudAlertById(id);
    if (!alert) throw new NotFoundError('Fraud alert assessment not found');
    return alert;
  }

  /**
   * 8. Audit Logs Dashboard Query
   */
  async listAuditLogs(query = {}) {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const filter = {};
    if (query.entityType) filter.entityType = query.entityType;
    if (query.entityId) filter.entityId = query.entityId;
    if (query.eventName) filter.eventName = query.eventName;
    if (query.actorId) filter.actorId = query.actorId;
    if (query.startDate || query.endDate) {
      filter.timestamp = {};
      if (query.startDate) filter.timestamp.$gte = new Date(query.startDate);
      if (query.endDate) filter.timestamp.$lte = new Date(query.endDate);
    }

    const { items, total } = await this.repo.listAuditLogs(filter, { skip, limit });
    return this.formatPaginated(items, total, page, limit);
  }

  async getAuditLogDetails(id) {
    const log = await this.repo.getAuditLogById(id);
    if (!log) throw new NotFoundError('Audit log record not found');
    return log;
  }

  /**
   * Verifications Query (For manual reviews queue)
   */
  async listVerifications(query = {}) {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const filter = {};
    if (query.status) filter.status = query.status;

    const { items, total } = await this.repo.listVerifications(filter, { skip, limit });
    return this.formatPaginated(items, total, page, limit);
  }

  // =========================================================================
  // ADMINISTRATIVE MODERATION ACTIONS (ALL PRODUCE IMMUTABLE AUDIT EVENTS)
  // =========================================================================

  /**
   * Action 1: Suspend User (ADMIN ONLY)
   */
  async suspendUser(userId, adminUser, reason) {
    const user = await User.findById(userId);
    if (!user) throw new NotFoundError('User not found');

    if (user.role === 'ADMIN' && adminUser.userId === userId.toString()) {
      throw new BadRequestError('Administrators cannot suspend their own account');
    }

    const previousStatus = user.accountStatus;
    user.accountStatus = 'SUSPENDED';
    await user.save();

    // Invalidate user refresh tokens
    await RefreshToken.deleteMany({ userId: user._id });

    // De-list active listings to protect marketplace buyers
    await Listing.updateMany(
      { sellerId: user._id, status: ListingStatus.ACTIVE },
      { $set: { status: ListingStatus.SUSPENDED } }
    );

    // Release any active buyer reservations
    const activeReservations = await Reservation.find({
      buyerId: user._id,
      status: ReservationStatus.ACTIVE,
    });
    for (const res of activeReservations) {
      res.status = ReservationStatus.RELEASED;
      res.releaseReason = 'Buyer account suspended by administrator';
      await res.save();
      await Listing.findByIdAndUpdate(res.listingId, { status: ListingStatus.ACTIVE });
    }

    // 1. Mandatory immutable audit event
    const eventId = `audit_admin_${Date.now()}_${crypto.randomUUID().replace(/-/g, '')}`;
    await auditService.recordAuditEvent({
      eventId,
      eventName: 'admin.user.suspended',
      data: {
        userId: user._id.toString(),
        userName: user.name,
        userEmail: user.email,
        reason,
        previousStatus,
        newStatus: 'SUSPENDED',
      },
      user: {
        id: adminUser.userId || adminUser.id,
        role: adminUser.role,
      },
    });

    // 2. Notify suspended user
    await notificationService.sendNotification(user._id, {
      title: 'Account Suspended',
      message: `Your account has been suspended by administration. Reason: ${reason}`,
      type: 'SECURITY_ALERT',
      data: { reason },
    });

    logger.info(
      { adminId: adminUser.userId, targetUserId: user._id, reason },
      'Administrator suspended user account and revoked sessions'
    );

    return {
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        accountStatus: user.accountStatus,
      },
      reason,
    };
  }

  /**
   * Action 2: Unsuspend User (ADMIN ONLY)
   */
  async unsuspendUser(userId, adminUser, reason) {
    const user = await User.findById(userId);
    if (!user) throw new NotFoundError('User not found');

    const previousStatus = user.accountStatus;
    user.accountStatus = 'ACTIVE';
    await user.save();

    // 1. Mandatory immutable audit event
    const eventId = `audit_admin_${Date.now()}_${crypto.randomUUID().replace(/-/g, '')}`;
    await auditService.recordAuditEvent({
      eventId,
      eventName: 'admin.user.unsuspended',
      data: {
        userId: user._id.toString(),
        userName: user.name,
        userEmail: user.email,
        reason,
        previousStatus,
        newStatus: 'ACTIVE',
      },
      user: {
        id: adminUser.userId || adminUser.id,
        role: adminUser.role,
      },
    });

    // 2. Notify reinstated user
    await notificationService.sendNotification(user._id, {
      title: 'Account Reinstated',
      message: `Your account has been reactivated by administration. Reason: ${reason}`,
      type: 'SYSTEM',
      data: { reason },
    });

    logger.info(
      { adminId: adminUser.userId, targetUserId: user._id, reason },
      'Administrator unsuspended user account'
    );

    return {
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        accountStatus: user.accountStatus,
      },
      reason,
    };
  }

  /**
   * Action 3: Suspend Listing (ADMIN & MODERATOR)
   */
  async suspendListing(listingId, adminUser, reason) {
    const listing = await Listing.findById(listingId);
    if (!listing) throw new NotFoundError('Listing not found');

    const previousStatus = listing.status;
    listing.status = ListingStatus.SUSPENDED;
    await listing.save();

    // Release any active reservation
    const reservation = await Reservation.findOne({
      listingId: listing._id,
      status: ReservationStatus.ACTIVE,
    });
    if (reservation) {
      reservation.status = ReservationStatus.RELEASED;
      reservation.releaseReason = `Listing suspended by moderation: ${reason}`;
      await reservation.save();
    }

    // 1. Mandatory immutable audit event
    const eventId = `audit_admin_${Date.now()}_${crypto.randomUUID().replace(/-/g, '')}`;
    await auditService.recordAuditEvent({
      eventId,
      eventName: 'admin.listing.suspended',
      data: {
        listingId: listing._id.toString(),
        sellerId: listing.sellerId?.toString(),
        assetId: listing.assetId?.toString(),
        reason,
        previousStatus,
        newStatus: ListingStatus.SUSPENDED,
      },
      user: {
        id: adminUser.userId || adminUser.id,
        role: adminUser.role,
      },
    });

    // 2. Notify seller
    if (listing.sellerId) {
      await notificationService.sendNotification(listing.sellerId, {
        title: 'Listing Moderated & Suspended',
        message: `Your marketplace listing #${listing._id} was suspended by moderation. Reason: ${reason}`,
        type: 'LISTING',
        data: { listingId: listing._id, reason },
      });
    }

    logger.info(
      { moderatorId: adminUser.userId, listingId: listing._id, reason },
      'Listing suspended by administrative moderation'
    );

    return {
      success: true,
      listing: {
        id: listing._id,
        status: listing.status,
      },
      reason,
    };
  }

  /**
   * Action 4: Approve Manual Verification (ADMIN & MODERATOR)
   */
  async approveManualVerification(
    verificationId,
    adminUser,
    { notes = '', confidenceScore = 100 } = {}
  ) {
    const verification = await Verification.findById(verificationId);
    if (!verification) throw new NotFoundError('Verification record not found');

    const previousStatus = verification.status;
    verification.status = VerificationStatus.VERIFIED;
    verification.verifierId = adminUser.userId || adminUser.id;
    verification.confidenceScore = confidenceScore;
    verification.notes = notes || 'Manually verified and approved by moderation';
    verification.completedAt = new Date();
    await verification.save();

    // Update associated Asset
    const asset = await Asset.findByIdAndUpdate(
      verification.assetId,
      {
        $set: {
          verificationStatus: VerificationStatus.VERIFIED,
          status: AssetStatus.VERIFIED,
          verifiedAt: new Date(),
        },
      },
      { new: true }
    );

    // 1. Mandatory immutable audit event
    const eventId = `audit_admin_${Date.now()}_${crypto.randomUUID().replace(/-/g, '')}`;
    await auditService.recordAuditEvent({
      eventId,
      eventName: 'admin.verification.approved',
      data: {
        verificationId: verification._id.toString(),
        assetId: verification.assetId.toString(),
        requestedBy: verification.requestedBy?.toString(),
        notes,
        confidenceScore,
        previousStatus,
        newStatus: VerificationStatus.VERIFIED,
      },
      user: {
        id: adminUser.userId || adminUser.id,
        role: adminUser.role,
      },
    });

    // 2. Publish asset.verified event
    publishEvent(
      EventNames.ASSET_VERIFIED,
      {
        assetId: verification.assetId.toString(),
        ownerId: asset?.ownerId?.toString() || verification.requestedBy?.toString(),
        verificationId: verification._id.toString(),
        status: VerificationStatus.VERIFIED,
        confidenceScore,
      },
      { id: adminUser.userId || adminUser.id }
    ).catch(() => {});

    // 3. Notify owner
    const ownerId = asset?.ownerId || verification.requestedBy;
    if (ownerId) {
      await notificationService.sendNotification(ownerId, {
        title: 'Verification Approved by Moderation',
        message: `Your asset verification #${verification._id} was manually approved by moderation.`,
        type: 'ASSET_VERIFIED',
        data: { verificationId: verification._id, assetId: verification.assetId },
      });
    }

    logger.info(
      { moderatorId: adminUser.userId, verificationId: verification._id },
      'Verification manually approved by moderation'
    );

    return {
      success: true,
      verification,
      asset,
    };
  }

  /**
   * Action 5: Reject Verification (ADMIN & MODERATOR)
   */
  async rejectVerification(verificationId, adminUser, { reason, notes = '' }) {
    const verification = await Verification.findById(verificationId);
    if (!verification) throw new NotFoundError('Verification record not found');

    const previousStatus = verification.status;
    verification.status = VerificationStatus.FAILED;
    verification.verifierId = adminUser.userId || adminUser.id;
    verification.notes = `${reason}${notes ? ` - ${notes}` : ''}`;
    verification.completedAt = new Date();
    await verification.save();

    // Update associated Asset
    const asset = await Asset.findByIdAndUpdate(
      verification.assetId,
      {
        $set: {
          verificationStatus: VerificationStatus.FAILED,
          status: AssetStatus.REJECTED,
        },
      },
      { new: true }
    );

    // 1. Mandatory immutable audit event
    const eventId = `audit_admin_${Date.now()}_${crypto.randomUUID().replace(/-/g, '')}`;
    await auditService.recordAuditEvent({
      eventId,
      eventName: 'admin.verification.rejected',
      data: {
        verificationId: verification._id.toString(),
        assetId: verification.assetId.toString(),
        requestedBy: verification.requestedBy?.toString(),
        reason,
        notes,
        previousStatus,
        newStatus: VerificationStatus.FAILED,
      },
      user: {
        id: adminUser.userId || adminUser.id,
        role: adminUser.role,
      },
    });

    // 2. Notify asset owner
    const ownerId = asset?.ownerId || verification.requestedBy;
    if (ownerId) {
      await notificationService.sendNotification(ownerId, {
        title: 'Verification Rejected',
        message: `Your asset verification was rejected by moderation. Reason: ${reason}`,
        type: 'SYSTEM',
        data: { verificationId: verification._id, assetId: verification.assetId, reason },
      });
    }

    logger.info(
      { moderatorId: adminUser.userId, verificationId: verification._id, reason },
      'Verification rejected by moderation'
    );

    return {
      success: true,
      verification,
      asset,
      reason,
    };
  }

  /**
   * Action 6: Resolve Report (ADMIN & MODERATOR)
   */
  async resolveReport(reportId, adminUser, { status, notes }) {
    const report = await Report.findById(reportId);
    if (!report) throw new NotFoundError('Report not found');

    const previousStatus = report.status;
    report.status = status;
    report.assignedAdminId = adminUser.userId || adminUser.id;
    report.resolutionNotes = notes;
    await report.save();

    // 1. Mandatory immutable audit event
    const eventId = `audit_admin_${Date.now()}_${crypto.randomUUID().replace(/-/g, '')}`;
    await auditService.recordAuditEvent({
      eventId,
      eventName: 'admin.report.resolved',
      data: {
        reportId: report._id.toString(),
        targetType: report.targetType,
        targetId: report.targetId.toString(),
        reporterId: report.reporterId?.toString(),
        category: report.category,
        previousStatus,
        newStatus: status,
        status,
        notes,
      },
      user: {
        id: adminUser.userId || adminUser.id,
        role: adminUser.role,
      },
    });

    // 2. Notify reporter of resolution
    if (report.reporterId) {
      await notificationService.sendNotification(report.reporterId, {
        title: `Report #${report._id} Updated`,
        message: `Your report status was updated to '${status}'. Notes: ${notes}`,
        type: 'SYSTEM',
        data: { reportId: report._id, status },
      });
    }

    logger.info(
      { moderatorId: adminUser.userId, reportId: report._id, status },
      'Report resolved by moderation'
    );

    return {
      success: true,
      report,
    };
  }

  /**
   * Action 7: Freeze Transaction (ADMIN ONLY)
   */
  async freezeTransaction(transactionId, adminUser, reason) {
    const tx = await Transaction.findById(transactionId);
    if (!tx) throw new NotFoundError('Transaction not found');

    if (tx.transactionStatus === TransactionStatus.COMPLETED) {
      throw new BadRequestError('Cannot freeze an already completed transaction');
    }

    if (tx.transactionStatus === TransactionStatus.CANCELLED) {
      throw new BadRequestError('Cannot freeze an already cancelled transaction');
    }

    const previousTxStatus = tx.transactionStatus;
    const previousPayStatus = tx.paymentStatus;

    tx.transactionStatus = TransactionStatus.DISPUTED;
    tx.escrowStatus = 'HELD'; // Guarantee funds remain strictly held in escrow
    tx.disputeReason = `Frozen by administrator: ${reason}`;
    await tx.save();

    // Record in TransactionEvent log
    await TransactionEvent.create({
      transactionId: tx._id,
      eventType: TransactionEventType.TRANSACTION_DISPUTED,
      fromTransactionStatus: previousTxStatus,
      toTransactionStatus: TransactionStatus.DISPUTED,
      fromPaymentStatus: previousPayStatus,
      toPaymentStatus: tx.paymentStatus,
      actorId: adminUser.userId || adminUser.id,
      actorRole: 'ADMIN',
      metadata: {
        action: 'TRANSACTION_FROZEN',
        reason,
        escrowStatus: 'HELD',
      },
    });

    // 1. Mandatory immutable audit event
    const eventId = `audit_admin_${Date.now()}_${crypto.randomUUID().replace(/-/g, '')}`;
    await auditService.recordAuditEvent({
      eventId,
      eventName: 'admin.transaction.frozen',
      data: {
        transactionId: tx._id.toString(),
        buyerId: tx.buyerId?.toString(),
        sellerId: tx.sellerId?.toString(),
        amount: tx.amount,
        currency: tx.currency,
        reason,
        previousStatus: previousTxStatus,
        newStatus: TransactionStatus.DISPUTED,
        escrowStatus: 'HELD',
      },
      user: {
        id: adminUser.userId || adminUser.id,
        role: adminUser.role,
      },
    });

    // 2. Notify buyer and seller
    const notifyPayload = {
      title: `Transaction #${tx._id} Frozen by Compliance`,
      message: `Transaction #${tx._id} has been frozen under administrative review. Escrow funds are secured. Reason: ${reason}`,
      type: 'TRANSACTION',
      data: { transactionId: tx._id, reason },
    };

    if (tx.buyerId) {
      await notificationService.sendNotification(tx.buyerId, notifyPayload);
    }
    if (tx.sellerId) {
      await notificationService.sendNotification(tx.sellerId, notifyPayload);
    }

    logger.info(
      { adminId: adminUser.userId, transactionId: tx._id, reason },
      'Administrator froze transaction and secured escrow'
    );

    return {
      success: true,
      transaction: tx,
      reason,
    };
  }
}

export const adminService = new AdminService();
