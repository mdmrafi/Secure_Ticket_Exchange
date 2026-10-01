import { AssetValidator } from '../interfaces/asset-validator.interface.js';
import { AssetTypes } from '../../../../common/constants/asset-types.constant.js';

export class BusTicketValidator extends AssetValidator {
  constructor() {
    super(AssetTypes.BUS_TICKET);
  }

  validateAsset(assetData = {}) {
    const errors = [];
    const meta = assetData.metadata || {};

    if (!meta.operator) {
      errors.push('Bus ticket requires an operator name (e.g. Hanif, Green Line, Shohoz)');
    }

    if (!meta.source || !meta.destination) {
      errors.push('Bus ticket requires both origin and destination cities');
    }

    if (
      meta.source &&
      meta.destination &&
      meta.source.toLowerCase() === meta.destination.toLowerCase()
    ) {
      errors.push('Origin and destination stations cannot be the same');
    }

    if (!meta.ticketNumber && !meta.bookingReference && !assetData.uniqueAssetIdentifier) {
      errors.push('Bus ticket requires a booking reference or ticket number');
    }

    const value = assetData.originalValue !== undefined ? assetData.originalValue : meta.fare;
    if (value !== undefined && Number(value) < 0) {
      errors.push('Ticket face value cannot be negative');
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
    const faceValue = Number(asset.originalValue || asset.metadata?.fare || 0);

    if (askingPrice <= 0) {
      errors.push('Asking price must be a positive number');
    }

    // Bus Ticket Anti-Scalping Policy: Maximum 10% markup permitted over original face value
    if (faceValue > 0) {
      const maxAllowed = Math.round(faceValue * 1.1);
      if (askingPrice > maxAllowed) {
        errors.push(
          `Anti-scalping violation: Bus ticket price cannot exceed 110% of face value (Max: ${maxAllowed} ${asset.currency || 'BDT'}). Current asking price: ${askingPrice}`
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
      'operator',
      'source',
      'destination',
      'route',
      'seatNumber',
      'departureDate',
      'departureTime',
      'ticketNumber',
      'bookingReference',
    ];

    if (userRole !== 'ADMIN') {
      const violated = protectedFields.filter((f) => f in updateData);
      if (violated.length > 0) {
        errors.push(
          `Modification of protected bus ticket fields is prohibited: [${violated.join(', ')}]`
        );
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
