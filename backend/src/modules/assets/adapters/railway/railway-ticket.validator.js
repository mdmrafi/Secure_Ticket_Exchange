import { AssetValidator } from '../interfaces/asset-validator.interface.js';
import { AssetTypes } from '../../../../common/constants/asset-types.constant.js';

export class RailwayTicketValidator extends AssetValidator {
  constructor() {
    super(AssetTypes.RAILWAY_TICKET);
  }

  validateAsset(assetData = {}) {
    const errors = [];
    const meta = assetData.metadata || {};

    if (!meta.pnr && !meta.ticketNumber && !assetData.uniqueAssetIdentifier) {
      errors.push('Railway ticket requires a PNR, ticket number, or unique asset identifier');
    }

    if (
      meta.source &&
      meta.destination &&
      meta.source.toLowerCase() === meta.destination.toLowerCase()
    ) {
      errors.push('Departure origin station and destination station cannot be identical');
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

    // Railway tickets: Zero-markup strict anti-scalping policy
    if (faceValue > 0 && askingPrice > faceValue) {
      errors.push(
        `Anti-scalping violation: Railway tickets cannot be sold above original face value (${faceValue} ${asset.currency || 'BDT'}). Current asking price: ${askingPrice}`
      );
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  validateUpdate(currentRecord, updateData = {}, userRole = 'USER') {
    const errors = [];
    const protectedFields = [
      'pnr',
      'ticketNumber',
      'trainNumber',
      'trainName',
      'source',
      'destination',
      'journeyDate',
      'coach',
      'seat',
      'class',
      'originalFaceValue',
      'originalValue',
    ];

    if (userRole !== 'ADMIN') {
      const violated = protectedFields.filter((f) => f in updateData);
      if (violated.length > 0) {
        errors.push(
          `Modification of protected railway ticket fields is prohibited: [${violated.join(', ')}]`
        );
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
