import { AssetMetadata } from '../interfaces/asset-metadata.interface.js';
import { AssetTypes } from '../../../../common/constants/asset-types.constant.js';

export class EventTicketMetadata extends AssetMetadata {
  constructor() {
    super(AssetTypes.EVENT_TICKET);
  }

  getRequiredFields() {
    return ['eventName', 'venue', 'eventDate'];
  }

  getProtectedFields() {
    return [
      'assetId',
      'sellerId',
      'eventName',
      'venue',
      'eventDate',
      'section',
      'row',
      'seat',
      'ticketTier',
      'barcode',
      'organizer',
      'originalValue',
      'currency',
    ];
  }

  normalize(raw = {}) {
    const eventName = raw.eventName || raw.title || 'Concert / Live Event';
    const venue = raw.venue || raw.location || 'Main Arena';
    const barcode = raw.barcode || raw.ticketId || null;

    return {
      ...raw,
      eventName: String(eventName).trim(),
      venue: String(venue).trim(),
      eventDate: raw.eventDate ? String(raw.eventDate).trim() : null,
      section: raw.section ? String(raw.section).trim() : null,
      row: raw.row ? String(raw.row).trim() : null,
      seat: raw.seat ? String(raw.seat).trim() : null,
      ticketTier: raw.ticketTier || 'General Admission',
      barcode: barcode ? String(barcode).trim() : null,
      organizer: raw.organizer || 'Official Event Organizer',
      originalFaceValue: Number(raw.originalFaceValue || raw.originalValue || raw.fare || 0),
    };
  }

  generateIdentifier(metadata = {}, fallbackContext = {}) {
    const eventTag = (metadata.eventName || 'EVENT')
      .replace(/[^A-Za-z0-9]/g, '')
      .slice(0, 6)
      .toUpperCase();
    const barcode = metadata.barcode || Math.random().toString(36).substring(2, 8).toUpperCase();
    return `EVENT-${eventTag}-${barcode}`;
  }

  generateTitle(metadata = {}) {
    const name = metadata.eventName || 'Live Event';
    const venue = metadata.venue || 'Venue';
    return `${name} @ ${venue}`;
  }

  generateSummary(metadata = {}) {
    const tier = metadata.ticketTier ? ` [${metadata.ticketTier}]` : '';
    const date = metadata.eventDate ? ` | Date: ${metadata.eventDate}` : '';
    const seat = metadata.seat ? ` | Seat: ${metadata.section || ''} ${metadata.seat}` : '';
    return `${this.generateTitle(metadata)}${tier}${seat}${date}`;
  }
}
