import { BaseAsset } from './base-asset.js';
import { AssetTypes } from '../../../common/constants/asset-types.constant.js';

/**
 * EventTicket Asset Domain Model
 * Supports future concert, sports, and conference ticketing.
 */
export class EventTicket extends BaseAsset {
  constructor(data = {}) {
    super({
      ...data,
      assetType: AssetTypes.EVENT_TICKET,
    });
  }

  get eventName() {
    return this.metadata?.eventName;
  }

  get venue() {
    return this.metadata?.venue;
  }

  get eventDate() {
    return this.metadata?.eventDate;
  }

  generateUniqueIdentifier() {
    if (this.metadata?.barcode || this.metadata?.ticketId) {
      return `EVENT-${this.metadata.barcode || this.metadata.ticketId}`;
    }
    return super.generateUniqueIdentifier();
  }

  getSummary() {
    return `Event Ticket: ${this.eventName || this.title} at ${this.venue || 'Venue'}`;
  }
}
