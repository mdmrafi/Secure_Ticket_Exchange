import mongoose from 'mongoose';
import { VerificationStatus } from '../../common/constants/asset-types.constant.js';

const verificationSchema = new mongoose.Schema(
  {
    assetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Asset',
      required: true,
      index: true,
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(VerificationStatus),
      default: VerificationStatus.SUBMITTED,
      index: true,
    },
    verifierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    // Multi-layer checks: OCR, QR validation, duplicate checks, authority verification
    checks: [
      {
        checkType: { type: String, required: true },
        status: { type: String, enum: ['PENDING', 'PASSED', 'FAILED'], default: 'PENDING' },
        score: { type: Number, default: 0 },
        details: { type: mongoose.Schema.Types.Mixed },
        performedAt: { type: Date, default: Date.now },
      },
    ],
    fraudFlags: [
      {
        code: String,
        description: String,
        severity: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
      },
    ],
    confidenceScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    notes: String,
    completedAt: Date,
  },
  {
    timestamps: true,
  }
);

export const Verification = mongoose.model('Verification', verificationSchema);
