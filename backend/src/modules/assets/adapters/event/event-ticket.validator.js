import { AssetValidator } from '../interfaces/asset-validator.interface.js';
import { AssetTypes } from '../../../../common/constants/asset-types.constant.js';

export class EventTicketValidator extends AssetValidator {
  constructor() {
    super(AssetTypes.EVENT_TICKET);
  }

  validateAsset(assetData = {}) {
    const errors = [];
    const meta = assetData.metadata || {};

    if (!meta.eventName) {
      errors.push('Event ticket requires an event name');
    }

    if (!meta.venue) {
      errors.push('Event ticket requires a venue location');
    }

    if (!meta.eventDate) {
      errors.push('Event ticket requires a scheduled event date');
    }

    const value =
      assetData.originalValue !== undefined ? assetData.originalValue : meta.originalFaceValue;
    if (value !== undefined && Number(value) < 0) {
      errors.push('Event ticket face value cannot be negative');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  validateListing(asset, listingData = {}, seller = {}) {
    const errors = [];
    const askingPrice = Number(
      listingData.askingPrice !== undefined ? listingData.askingPrice : listingData.price
    );
    const faceValue = Number(asset.originalValue || asset.metadata?.originalFaceValue || 0);

    if (askingPrice <= 0) {
      errors.push('Asking price must be a positive number');
    }

    // Event Anti-Scalping Law: Cap at 120% of face value (max 20% premium)
    if (faceValue > 0) {
      const maxAllowed = Math.round(faceValue * 1.2);
      if (askingPrice > maxAllowed) {
        errors.push(
          `Anti-scalping regulation: Event ticket resale price is capped at 120% of face value (Max: ${maxAllowed} ${asset.currency || 'BDT'}). Current asking price: ${askingPrice}`
        );
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  validateUpdate(currentRecord, updateData = {}, userRole = 'USER') {
    const errors = [];
    const protectedFields = [
      'eventName',
      'venue',
      'eventDate',
      'section',
      'row',
      'seat',
      'ticketTier',
      'barcode',
    ];

    if (userRole !== 'ADMIN') {
      const violated = protectedFields.filter((f) => f in updateData);
      if (violated.length > 0) {
        errors.push(
          `Modification of protected event ticket fields is prohibited: [${violated.join(', ')}]`
        );
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
