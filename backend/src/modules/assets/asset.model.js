import mongoose from 'mongoose';
import { AssetTypes, AssetStatus, VerificationStatus } from '../../common/constants/asset-types.constant.js';
import { ExtractionStatus } from './constants/ingestion.constant.js';

const assetSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Asset ownerId is required'],
      index: true,
    },
    assetType: {
      type: String,
      enum: {
        values: Object.values(AssetTypes),
        message: '{VALUE} is not a supported asset type',
      },
      required: [true, 'Asset type is required'],
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(AssetStatus),
      default: AssetStatus.DRAFT,
      index: true,
    },
    verificationStatus: {
      type: String,
      enum: Object.values(VerificationStatus),
      default: VerificationStatus.NOT_REQUESTED,
      index: true,
    },
    title: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    // Unique identifier (e.g., PNR for Railway tickets or ticket barcode)
    uniqueAssetIdentifier: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    originalValue: {
      type: Number,
      default: 0,
      min: 0,
    },
    currency: {
      type: String,
      default: 'BDT',
      uppercase: true,
      trim: true,
    },
    // Extensible typed payload based on assetType (Railway ticket, Bus ticket, Event pass, Document, etc.)
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    // Document Ingestion & OCR Processing
    documentUrl: {
      type: String,
      trim: true,
      default: null,
    },
    extractionStatus: {
      type: String,
      enum: [...Object.values(ExtractionStatus), null],
      default: null,
      index: true,
    },
    ocrConfidence: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },
    extractedFields: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    // Supporting documents / digital certificates
    documents: [
      {
        url: String,
        documentType: String,
        fileHash: String,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    verifiedAt: {
      type: Date,
      default: null,
    },
    isTransferable: {
      type: Boolean,
      default: true,
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

// Auto-derive uniqueAssetIdentifier and title if not explicitly provided
assetSchema.pre('validate', function (next) {
  if (!this.uniqueAssetIdentifier) {
    if (this.metadata?.pnr) {
      this.uniqueAssetIdentifier = `RAIL-PNR-${this.metadata.pnr.toString().trim()}`;
    } else if (this.metadata?.ticketNumber) {
      this.uniqueAssetIdentifier = `${this.assetType}-${this.metadata.ticketNumber.toString().trim()}`;
    } else if (this.metadata?.uniqueIdentifier) {
      this.uniqueAssetIdentifier = this.metadata.uniqueIdentifier.toString().trim();
    } else {
      this.uniqueAssetIdentifier = `${this.assetType}-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    }
  }

  if (!this.title) {
    if (this.metadata?.trainNumber && this.metadata?.fromStation && this.metadata?.toStation) {
      this.title = `Train ${this.metadata.trainNumber}: ${this.metadata.fromStation} -> ${this.metadata.toStation}`;
    } else if (this.metadata?.pnr) {
      this.title = `${this.assetType} (PNR: ${this.metadata.pnr})`;
    } else {
      this.title = `${this.assetType} Asset (${this.uniqueAssetIdentifier})`;
    }
  }

  next();
});

// Compound index to ensure uniqueness of asset per assetType
assetSchema.index({ assetType: 1, uniqueAssetIdentifier: 1 }, { unique: true });

export const Asset = mongoose.model('Asset', assetSchema);
