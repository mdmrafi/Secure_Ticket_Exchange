import mongoose from 'mongoose';
import { TransferEventType } from '../../common/constants/asset-types.constant.js';

const transferEventSchema = new mongoose.Schema(
  {
    transferRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TransferRequest',
      required: [true, 'TransferRequest ID is required'],
      index: true,
    },
    assetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Asset',
      required: [true, 'Asset ID is required'],
      index: true,
    },
    eventType: {
      type: String,
      required: [true, 'Event type is required'],
      enum: Object.values(TransferEventType),
      index: true,
    },
    fromStatus: {
      type: String,
      required: true,
    },
    toStatus: {
      type: String,
      required: true,
    },
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    actorRole: {
      type: String,
      enum: ['BUYER', 'SELLER', 'ADMIN', 'SYSTEM', 'TRANSFER_PROVIDER'],
      default: 'SYSTEM',
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Append-only immutable log
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

// Indexes for audit lookup
transferEventSchema.index({ transferRequestId: 1, createdAt: 1 });
transferEventSchema.index({ assetId: 1, createdAt: 1 });

// Strictly prevent updates or deletions to guarantee immutability
transferEventSchema.pre(
  ['updateOne', 'updateMany', 'findOneAndUpdate', 'deleteOne', 'deleteMany', 'findOneAndDelete'],
  function (next) {
    const error = new Error(
      'Transfer audit event logs are strictly immutable and cannot be updated or deleted.'
    );
    next(error);
  }
);

export const TransferEvent = mongoose.model('TransferEvent', transferEventSchema);
