import mongoose from 'mongoose';
import { KYCStatus, KYCAuditAction } from './kyc.constant.js';

const kycAuditLogSchema = new mongoose.Schema(
  {
    kycId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'KYCRecord',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    fromStatus: {
      type: String,
      enum: Object.values(KYCStatus),
      required: true,
    },
    toStatus: {
      type: String,
      enum: Object.values(KYCStatus),
      required: true,
    },
    action: {
      type: String,
      enum: Object.values(KYCAuditAction),
      required: true,
    },
    changedBy: {
      type: String,
      enum: ['USER', 'SYSTEM', 'PROVIDER', 'ADMIN'],
      default: 'USER',
    },
    changedByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reason: {
      type: String,
      trim: true,
    },
    ipAddress: {
      type: String,
      trim: true,
    },
    userAgent: {
      type: String,
      trim: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false, // Explicit timestamp field used above
    toJSON: {
      transform: (doc, ret) => {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Read-optimized index for audit investigations
kycAuditLogSchema.index({ userId: 1, timestamp: -1 });

export const KYCAuditLog = mongoose.model('KYCAuditLog', kycAuditLogSchema);
