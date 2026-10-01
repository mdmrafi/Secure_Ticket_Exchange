import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    eventId: {
      type: String,
      required: true,
    },
    eventName: {
      type: String,
      required: true,
      index: true,
    },
    entityType: {
      type: String,
      required: true,
      enum: [
        'USER',
        'KYC',
        'ASSET',
        'LISTING',
        'TRANSACTION',
        'PAYMENT',
        'TRANSFER',
        'FRAUD',
        'REPORT',
        'VERIFICATION',
        'SYSTEM',
      ],
      index: true,
    },
    entityId: {
      type: String,
      required: true,
      index: true,
    },
    actorId: {
      type: String,
      default: null,
      index: true,
    },
    actorRole: {
      type: String,
      default: 'SYSTEM',
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
      default: null,
    },
    userAgent: {
      type: String,
      default: null,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Read-optimized indexes for compliance queries
auditLogSchema.index({ entityType: 1, entityId: 1, timestamp: -1 });
auditLogSchema.index({ actorId: 1, timestamp: -1 });
auditLogSchema.index({ eventId: 1 }, { unique: true });

export const AuditLog = mongoose.model('SystemAuditLog', auditLogSchema);
