import { AssetMetadata } from '../interfaces/asset-metadata.interface.js';
import { AssetTypes } from '../../../../common/constants/asset-types.constant.js';

export class RailwayTicketMetadata extends AssetMetadata {
  constructor() {
    super(AssetTypes.RAILWAY_TICKET);
  }

  getRequiredFields() {
    return ['pnr', 'source', 'destination', 'journeyDate'];
  }

  getProtectedFields() {
    return [
      'assetId',
      'sellerId',
      'pnr',
      'ticketNumber',
      'uniqueAssetIdentifier',
      'passengerName',
      'source',
      'destination',
      'fromStation',
      'toStation',
      'trainNumber',
      'trainName',
      'seat',
      'seats',
      'coach',
      'class',
      'seatClass',
      'journeyDate',
      'departureTime',
      'originalValue',
      'currency',
      'fare',
      'extractedFields',
      'ocrConfidence',
      'documentUrl',
      'metadata',
      'documents',
    ];
  }

  normalize(raw = {}) {
    const pnr = raw.pnr ? String(raw.pnr).trim() : null;
    const ticketNumber = raw.ticketNumber ? String(raw.ticketNumber).trim() : null;
    const source = raw.source || raw.fromStation || raw.from || 'Origin';
    const destination = raw.destination || raw.toStation || raw.to || 'Destination';

    return {
      ...raw,
      pnr,
      ticketNumber: ticketNumber || pnr,
      source: String(source).trim(),
      destination: String(destination).trim(),
      trainNumber: raw.trainNumber ? String(raw.trainNumber).trim() : null,
      trainName: raw.trainName ? String(raw.trainName).trim() : 'Intercity Express',
      journeyDate: raw.journeyDate ? String(raw.journeyDate).trim() : null,
      departureTime: raw.departureTime ? String(raw.departureTime).trim() : null,
      coach: raw.coach ? String(raw.coach).trim() : null,
      seat: raw.seat ? String(raw.seat).trim() : null,
      class: raw.class || raw.seatClass || 'Standard',
      fare: Number(raw.fare || raw.originalValue || 0),
    };
  }

  generateIdentifier(metadata = {}, fallbackContext = {}) {
    if (metadata.pnr) {
      return `RAIL-PNR-${metadata.pnr}`;
    }
    if (metadata.ticketNumber) {
      return `RAIL-TKT-${metadata.ticketNumber}`;
    }
    return `RAIL-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  }

  generateTitle(metadata = {}) {
    if (metadata.source && metadata.destination) {
      const train = metadata.trainNumber
        ? `Train ${metadata.trainNumber}`
        : metadata.trainName || 'Train';
      return `${train}: ${metadata.source} -> ${metadata.destination}`;
    }
    if (metadata.pnr) {
      return `Railway Ticket - PNR: ${metadata.pnr}`;
    }
    return 'Railway Passenger Ticket';
  }

  generateSummary(metadata = {}) {
    const seatInfo = metadata.seat
      ? ` | Coach ${metadata.coach || 'N/A'}, Seat ${metadata.seat}`
      : '';
    const dateInfo = metadata.journeyDate ? ` | Date: ${metadata.journeyDate}` : '';
    return `${this.generateTitle(metadata)}${seatInfo}${dateInfo}`;
  }
}
