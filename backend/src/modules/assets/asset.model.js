import mongoose from 'mongoose';
import { AssetTypes, AssetStatus } from '../../common/constants/asset-types.constant.js';

const assetSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    assetType: {
      type: String,
      enum: Object.values(AssetTypes),
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    // Unique identifier (e.g., hashed PNR or ticket barcode) to prevent duplicate fraudulent listings
    uniqueAssetIdentifier: {
      type: String,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(AssetStatus),
      default: AssetStatus.DRAFT,
      index: true,
    },
    originalValue: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      default: 'BDT',
    },
    // Specialized payload based on assetType (Railway ticket, Bus ticket, Event pass, Legal Document, etc.)
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    // Supporting documents / proof files
    documents: [
      {
        url: String,
        documentType: String,
        fileHash: String,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    verifiedAt: Date,
    isTransferable: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure uniqueness of asset per type
assetSchema.index({ assetType: 1, uniqueAssetIdentifier: 1 }, { unique: true });

export const Asset = mongoose.model('Asset', assetSchema);
