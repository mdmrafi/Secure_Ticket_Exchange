import mongoose from 'mongoose';
import {
  RiskLevel,
  FraudSignalCode,
  AssessmentStatus,
  ReviewDecisionType,
} from './constants/fraud.constant.js';

const individualSignalSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      enum: Object.values(FraudSignalCode),
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    triggered: {
      type: Boolean,
      required: true,
    },
    severity: {
      type: String,
      enum: Object.values(RiskLevel),
      required: true,
    },
    score: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    weight: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.1,
    },
    description: {
      type: String,
      trim: true,
    },
    explanation: {
      type: String,
      required: true,
      trim: true,
    },
    evidence: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { _id: false }
);

const fraudAssessmentSchema = new mongoose.Schema(
  {
    targetType: {
      type: String,
      enum: ['ASSET', 'USER', 'LISTING', 'TRANSACTION'],
      default: 'ASSET',
      required: true,
      index: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    assetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Asset',
      default: null,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    riskLevel: {
      type: String,
      enum: Object.values(RiskLevel),
      required: true,
      index: true,
    },
    overallScore: {
      type: Number,
      min: 0,
      max: 100,
      required: true,
    },
    confidence: {
      type: Number,
      min: 0,
      max: 100,
      default: 85,
    },
    individualSignals: {
      type: [individualSignalSchema],
      default: [],
    },
    summaryExplanation: {
      type: String,
      required: true,
      trim: true,
    },
    recommendedAction: {
      type: String,
      enum: ['APPROVE', 'FLAG_FOR_MONITORING', 'MANUAL_REVIEW', 'SUSPEND'],
      default: 'APPROVE',
    },
    status: {
      type: String,
      enum: Object.values(AssessmentStatus),
      default: AssessmentStatus.PENDING_REVIEW,
      index: true,
    },
    reviewDecision: {
      decision: {
        type: String,
        enum: Object.values(ReviewDecisionType),
        default: null,
      },
      notes: { type: String, default: null },
      reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
      },
      reviewedAt: { type: Date, default: null },
    },
    modelVersion: {
      type: String,
      default: 'v1.0.0-explainable-rules',
    },
    provider: {
      type: String,
      default: 'EXPLAINABLE_FRAUD_ENGINE',
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      transform: (doc, ret) => {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Compound indexes for admin lookup and filtering
fraudAssessmentSchema.index(
  { targetType: 1, targetId: 1, timestamp: -1 },
  { name: 'idx_fraud_target_timestamp' }
);
fraudAssessmentSchema.index(
  { riskLevel: 1, status: 1 },
  { name: 'idx_fraud_risk_status' }
);

export const FraudAssessment = mongoose.model('FraudAssessment', fraudAssessmentSchema);
