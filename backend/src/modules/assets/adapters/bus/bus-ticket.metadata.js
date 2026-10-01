import { AssetMetadata } from '../interfaces/asset-metadata.interface.js';
import { AssetTypes } from '../../../../common/constants/asset-types.constant.js';

export class BusTicketMetadata extends AssetMetadata {
  constructor() {
    super(AssetTypes.BUS_TICKET);
  }

  getRequiredFields() {
    return ['operator', 'source', 'destination', 'departureDate'];
  }

  getProtectedFields() {
    return [
      'assetId',
      'sellerId',
      'operator',
      'route',
      'source',
      'destination',
      'departureDate',
      'departureTime',
      'seatNumber',
      'busType',
      'ticketNumber',
      'bookingReference',
      'originalValue',
      'currency',
      'metadata',
    ];
  }

  normalize(raw = {}) {
    const operator = raw.operator ? String(raw.operator).trim() : 'Intercity Bus';
    const source = raw.source || raw.from || raw.departureCity || 'Origin';
    const destination = raw.destination || raw.to || raw.arrivalCity || 'Destination';
    const ticketNumber = raw.ticketNumber || raw.bookingReference || raw.ticketId || null;

    return {
      ...raw,
      operator,
      source: String(source).trim(),
      destination: String(destination).trim(),
      route: raw.route || `${source} - ${destination}`,
      departureDate: raw.departureDate ? String(raw.departureDate).trim() : null,
      departureTime: raw.departureTime ? String(raw.departureTime).trim() : null,
      seatNumber: raw.seatNumber ? String(raw.seatNumber).trim() : raw.seat || null,
      busType: raw.busType || 'AC Deluxe',
      boardingPoint: raw.boardingPoint || source,
      ticketNumber: ticketNumber ? String(ticketNumber).trim() : null,
      bookingReference: raw.bookingReference ? String(raw.bookingReference).trim() : ticketNumber,
      fare: Number(raw.fare || raw.originalValue || 0),
    };
  }

  generateIdentifier(metadata = {}, fallbackContext = {}) {
    const opTag = (metadata.operator || 'BUS')
      .trim()
      .split(/\s+/)[0]
      .replace(/[^A-Za-z0-9]/g, '')
      .toUpperCase();
    const idCode =
      metadata.ticketNumber ||
      metadata.bookingReference ||
      Math.random().toString(36).substring(2, 8).toUpperCase();
    return `BUS-${opTag}-${idCode}`;
  }

  generateTitle(metadata = {}) {
    const op = metadata.operator || 'Intercity Bus';
    const src = metadata.source || 'Origin';
    const dst = metadata.destination || 'Destination';
    return `${op}: ${src} -> ${dst}`;
  }

  generateSummary(metadata = {}) {
    const seat = metadata.seatNumber ? ` | Seat: ${metadata.seatNumber}` : '';
    const date = metadata.departureDate ? ` | Date: ${metadata.departureDate}` : '';
    return `${metadata.operator || 'Bus'} (${metadata.busType || 'Standard'})${seat}${date}`;
  }
}
