import { BaseAsset } from './base-asset.js';
import { AssetTypes } from '../../../common/constants/asset-types.constant.js';

/**
 * RailwayTicket Asset Domain Model
 * Encapsulates railway travel ticket properties extracted via document ingestion or manual entry.
 */
export class RailwayTicket extends BaseAsset {
  constructor(data = {}) {
    super({
      ...data,
      assetType: AssetTypes.RAILWAY_TICKET,
    });
    this.documentUrl = data.documentUrl || data.metadata?.documentUrl || null;
    this.extractionStatus = data.extractionStatus || data.metadata?.extractionStatus || null;
    this.ocrConfidence = data.ocrConfidence || data.metadata?.ocrConfidence || null;
    this.extractedFields = data.extractedFields || data.metadata?.extractedFields || {};
  }

  // --- Core Railway Ticket Field Getters ---

  get ticketNumber() {
    return this.metadata?.ticketNumber || this.uniqueAssetIdentifier;
  }

  get pnr() {
    return this.metadata?.pnr || null;
  }

  get passengerName() {
    return this.metadata?.passengerName || null;
  }

  get trainName() {
    return this.metadata?.trainName || null;
  }

  get trainNumber() {
    return this.metadata?.trainNumber || null;
  }

  get source() {
    return this.metadata?.source || this.metadata?.fromStation || null;
  }

  get destination() {
    return this.metadata?.destination || this.metadata?.toStation || null;
  }

  get journeyDate() {
    return this.metadata?.journeyDate || null;
  }

  get departureTime() {
    return this.metadata?.departureTime || null;
  }

  get coach() {
    return this.metadata?.coach || null;
  }

  get seat() {
    return (
      this.metadata?.seat ||
      (Array.isArray(this.metadata?.seats)
        ? this.metadata.seats.join(', ')
        : this.metadata?.seats) ||
      null
    );
  }

  get class() {
    return this.metadata?.class || this.metadata?.seatClass || null;
  }

  get fare() {
    return this.metadata?.fare || this.originalValue || 0;
  }

  generateUniqueIdentifier() {
    if (this.metadata?.pnr) {
      return `RAIL-PNR-${this.metadata.pnr.toString().trim()}`;
    }
    if (this.metadata?.ticketNumber) {
      return `RAIL-TKT-${this.metadata.ticketNumber.toString().trim()}`;
    }
    return super.generateUniqueIdentifier();
  }

  getSummary() {
    if (this.source && this.destination) {
      return `Railway Ticket: ${this.source} to ${this.destination} (Train ${this.trainNumber || this.trainName || ''})`;
    }
    return `Railway Ticket - PNR: ${this.pnr || this.uniqueAssetIdentifier}`;
  }

  validateMetadata() {
    const errors = [];
    if (!this.metadata?.pnr && !this.metadata?.ticketNumber && !this.uniqueAssetIdentifier) {
      errors.push('Railway ticket requires a PNR, ticket number, or unique asset identifier');
    }
    return {
      valid: errors.length === 0,
      errors,
    };
  }

  toPersistence() {
    const base = super.toPersistence();
    return {
      ...base,
      documentUrl: this.documentUrl,
      extractionStatus: this.extractionStatus,
      ocrConfidence: this.ocrConfidence,
      extractedFields: this.extractedFields,
    };
  }
}
