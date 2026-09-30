import mongoose from 'mongoose';
import { TransactionStatus } from '../../common/constants/asset-types.constant.js';

const transactionSchema = new mongoose.Schema(
  {
    listingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Listing',
      required: true,
      index: true,
    },
    assetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Asset',
      required: true,
      index: true,
    },
    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'BDT',
    },
    status: {
      type: String,
      enum: Object.values(TransactionStatus),
      default: TransactionStatus.INITIATED,
      index: true,
    },
    escrowStatus: {
      type: String,
      enum: ['NONE', 'HELD', 'RELEASED', 'REFUNDED'],
      default: 'NONE',
    },
    paymentDetails: {
      provider: String,
      transactionRef: String,
      paidAt: Date,
    },
    disputeReason: String,
    completedAt: Date,
  },
  {
    timestamps: true,
  }
);

export const Transaction = mongoose.model('Transaction', transactionSchema);
