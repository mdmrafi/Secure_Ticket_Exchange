import { TransferPolicy } from '../interfaces/transfer-policy.interface.js';
import { AssetTypes } from '../../../../common/constants/asset-types.constant.js';

export class RailwayTicketTransferPolicy extends TransferPolicy {
  constructor() {
    super(AssetTypes.RAILWAY_TICKET);
  }

  isTransferable(asset) {
    return asset?.isTransferable !== false;
  }

  requiresAuthorizedProvider(asset) {
    return true;
  }

  allowsDirectIdentityModification(asset) {
    return false;
  }

  validateListingPrice(asset, askingPrice) {
    const faceValue = Number(asset.originalValue || asset.metadata?.fare || 0);
    const price = Number(askingPrice);

    if (price <= 0) {
      return {
        allowed: false,
        reason: 'Asking price must be greater than zero',
        maxAllowedPrice: faceValue,
      };
    }

    // Zero-markup transport anti-scalping policy
    if (faceValue > 0 && price > faceValue) {
      return {
        allowed: false,
        reason: `Strict transport regulation: Railway tickets cannot be marked up above original face value (${faceValue} ${asset.currency || 'BDT'})`,
        maxAllowedPrice: faceValue,
      };
    }

    return {
      allowed: true,
      maxAllowedPrice: faceValue,
    };
  }

  isKycRequired(asset, askingPrice, seller = {}) {
    // Railway passenger records always require verified seller identity
    return true;
  }

  checkTransferEligibility(asset, fromUser, toUser, context = {}) {
    const reasons = [];

    if (!context.provider?.isAuthorizedRailwayProvider) {
      reasons.push(
        'Railway tickets are non-transferable passenger records by transport regulations. Transfer requires an authorized official railway provider.'
      );
    }

    if (!this.isTransferable(asset)) {
      reasons.push('Railway ticket is flagged as non-transferable');
    }

    // Transfer window check: cannot transfer if train has already departed
    const journeyDate = asset.metadata?.journeyDate;
    if (journeyDate) {
      const departure = new Date(journeyDate);
      if (!isNaN(departure.getTime()) && departure < new Date()) {
        reasons.push(
          'Cannot transfer ticket for a journey that has already commenced or concluded'
        );
      }
    }

    return {
      eligible: reasons.length === 0,
      reasons,
      reason: reasons.join(', '),
      policyCode: reasons.length > 0 ? 'LEGALLY_NON_TRANSFERABLE' : undefined,
    };
  }

  getProtectedFields() {
    return [
      'pnr',
      'ticketNumber',
      'trainNumber',
      'trainName',
      'source',
      'destination',
      'journeyDate',
      'departureTime',
      'coach',
      'seat',
      'class',
      'originalValue',
      'originalFaceValue',
      'currency',
    ];
  }
}
