import mongoose from 'mongoose';
import { TransferRequestStatus } from '../../common/constants/asset-types.constant.js';

const transferRequestSchema = new mongoose.Schema(
  {
    assetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Asset',
      required: [true, 'assetId is required for transfer request'],
      index: true,
    },
    fromUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'fromUserId is required for transfer request'],
      index: true,
    },
    toUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'toUserId is required for transfer request'],
      index: true,
    },
    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction',
      default: null,
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: Object.values(TransferRequestStatus),
        message: '{VALUE} is not a valid transfer request status',
      },
      default: TransferRequestStatus.REQUESTED,
      index: true,
    },
    provider: {
      type: String,
      trim: true,
      default: 'MOCK_TRANSFER_PROVIDER',
    },
    providerTransferId: {
      type: String,
      trim: true,
      default: null,
    },
    eligibilityResult: {
      eligible: { type: Boolean, default: true },
      policyCode: { type: String, default: null },
      reason: { type: String, default: null },
    },
    rejectionReason: {
      type: String,
      trim: true,
      default: null,
    },
    failureReason: {
      type: String,
      trim: true,
      default: null,
    },
    cancellationReason: {
      type: String,
      trim: true,
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    completedAt: {
      type: Date,
      default: null,
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

// Compound indexes for performant lookups and race prevention
transferRequestSchema.index(
  { assetId: 1, status: 1 },
  { name: 'idx_transfer_asset_status' }
);
transferRequestSchema.index(
  { fromUserId: 1, status: 1 },
  { name: 'idx_transfer_from_user_status' }
);
transferRequestSchema.index(
  { toUserId: 1, status: 1 },
  { name: 'idx_transfer_to_user_status' }
);
transferRequestSchema.index(
  { transactionId: 1 },
  { name: 'idx_transfer_transaction_id' }
);

export const TransferRequest = mongoose.model('TransferRequest', transferRequestSchema);
