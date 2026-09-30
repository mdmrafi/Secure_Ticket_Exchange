import { BaseAsset } from './base-asset.js';
import { AssetTypes } from '../../../common/constants/asset-types.constant.js';

/**
 * BusTicket Asset Domain Model
 * Supports future bus ticket tokenization and exchange.
 */
export class BusTicket extends BaseAsset {
  constructor(data = {}) {
    super({
      ...data,
      assetType: AssetTypes.BUS_TICKET,
    });
  }

  get operator() {
    return this.metadata?.operator;
  }

  get route() {
    return this.metadata?.route;
  }

  get departureTime() {
    return this.metadata?.departureTime;
  }

  generateUniqueIdentifier() {
    if (this.metadata?.ticketNumber) {
      return `BUS-${this.operator || 'OP'}-${this.metadata.ticketNumber}`;
    }
    return super.generateUniqueIdentifier();
  }

  getSummary() {
    return `Bus Ticket: ${this.operator || 'Intercity Bus'} (${this.metadata?.from || ''} -> ${this.metadata?.to || ''})`;
  }
}
