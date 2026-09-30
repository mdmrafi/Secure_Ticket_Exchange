import mongoose from 'mongoose';
import { KYCStatus, KYCDocumentType, KYCVerificationLevel } from './kyc.constant.js';

const kycRecordSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(KYCStatus),
      default: KYCStatus.NOT_STARTED,
      index: true,
    },
    provider: {
      type: String,
      required: true,
      default: 'mock',
      trim: true,
    },
    // Reference ID / Inquiry ID from the KYC provider
    providerReferenceId: {
      type: String,
      trim: true,
      index: true,
      sparse: true,
    },
    documentType: {
      type: String,
      enum: Object.values(KYCDocumentType),
    },
    // Masked document number safe for client display (e.g. '******5678')
    documentNumberMasked: {
      type: String,
      trim: true,
    },
    // HMAC-SHA256 hash for anti-duplication without storing plaintext
    documentHash: {
      type: String,
      select: false, // Never returned in normal queries
    },
    // Sensitive PII encrypted at rest using AES-256-GCM
    encryptedIdentityData: {
      type: String,
      select: false, // Strictly excluded by default from queries
    },
    verificationLevel: {
      type: String,
      enum: Object.values(KYCVerificationLevel),
      default: KYCVerificationLevel.TIER_1_STANDARD,
    },
    // Lifecycle verification timestamps
    startedAt: {
      type: Date,
      default: null,
    },
    submittedAt: {
      type: Date,
      default: null,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
    rejectedAt: {
      type: Date,
      default: null,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    rejectionReason: {
      type: String,
      trim: true,
    },
    reviewNotes: {
      type: String,
      trim: true,
    },
    attemptsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Provider specific metadata (non-sensitive check scores, synthetic tags)
    providerMetadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        delete ret.encryptedIdentityData;
        delete ret.documentHash;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      transform: (doc, ret) => {
        delete ret.encryptedIdentityData;
        delete ret.documentHash;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const KYCRecord = mongoose.model('KYCRecord', kycRecordSchema);
