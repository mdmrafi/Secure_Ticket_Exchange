import { AuditLog } from './audit-log.model.js';
import { logger } from '../../config/logger.config.js';

export class AuditService {
  /**
   * Resolve entity information from event
   */
  resolveEntity(eventName, data = {}) {
    switch (eventName) {
      case 'user.created':
        return { entityType: 'USER', entityId: String(data.userId || data.id || 'unknown') };
      case 'kyc.completed':
        return { entityType: 'KYC', entityId: String(data.kycId || data.userId || 'unknown') };
      case 'asset.created':
      case 'asset.verified':
        return { entityType: 'ASSET', entityId: String(data.assetId || data.id || 'unknown') };
      case 'listing.created':
      case 'listing.reserved':
        return { entityType: 'LISTING', entityId: String(data.listingId || data.id || 'unknown') };
      case 'transaction.created':
        return { entityType: 'TRANSACTION', entityId: String(data.transactionId || data.id || 'unknown') };
      case 'payment.completed':
        return { entityType: 'PAYMENT', entityId: String(data.transactionId || data.paymentId || 'unknown') };
      case 'transfer.completed':
        return { entityType: 'TRANSFER', entityId: String(data.transferId || data.assetId || 'unknown') };
      case 'fraud.detected':
        return { entityType: 'FRAUD', entityId: String(data.targetId || data.assessmentId || 'unknown') };
      case 'report.created':
        return { entityType: 'REPORT', entityId: String(data.reportId || data.id || 'unknown') };
      default:
        return { entityType: 'SYSTEM', entityId: String(data.id || 'unknown') };
    }
  }

  /**
   * Ingest and persist an immutable audit log entry
   */
  async recordAuditEvent({ eventId, eventName, data, user = {}, timestamp = new Date() }) {
    const { entityType, entityId } = this.resolveEntity(eventName, data);

    try {
      const existing = await AuditLog.findOne({ eventId });
      if (existing) {
        logger.debug({ eventId }, 'Audit log already recorded for eventId');
        return existing;
      }

      const auditRecord = await AuditLog.create({
        eventId: eventId || `audit_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        eventName,
        entityType,
        entityId,
        actorId: user?.id || user?.userId || data?.actorId || data?.userId || null,
        actorRole: user?.role || data?.actorRole || 'SYSTEM',
        data,
        metadata: {
          source: 'inngest.audit_processing',
          recordedAt: new Date(),
        },
        ipAddress: user?.ip || data?.ipAddress || null,
        userAgent: user?.userAgent || data?.userAgent || null,
        timestamp: timestamp ? new Date(timestamp) : new Date(),
      });

      logger.info(
        { auditId: auditRecord._id, eventName, entityType, entityId },
        'Audit processing background job successfully recorded immutable event'
      );

      return auditRecord;
    } catch (err) {
      if (err.code === 11000) {
        // Unique index collision on eventId (idempotent duplicate)
        return AuditLog.findOne({ eventId });
      }
      logger.error({ err, eventName, eventId }, 'Failed to record audit log entry');
      throw err;
    }
  }

  /**
   * Query audit logs for an entity
   */
  async getEntityAuditTrail(entityType, entityId, limit = 50) {
    return AuditLog.find({ entityType, entityId }).sort({ timestamp: -1 }).limit(limit);
  }
}

export const auditService = new AuditService();
