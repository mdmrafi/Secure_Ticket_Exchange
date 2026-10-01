import { TransferPolicy } from '../interfaces/transfer-policy.interface.js';
import { AssetTypes } from '../../../../common/constants/asset-types.constant.js';

export class BusTicketTransferPolicy extends TransferPolicy {
  constructor() {
    super(AssetTypes.BUS_TICKET);
  }

  isTransferable(asset) {
    return asset?.isTransferable !== false;
  }

  requiresAuthorizedProvider(asset) {
    return false;
  }

  allowsDirectIdentityModification(asset) {
    return true;
  }

  validateListingPrice(asset, askingPrice) {
    const faceValue = Number(asset.originalValue || asset.metadata?.fare || 0);
    const price = Number(askingPrice);

    if (price <= 0) {
      return {
        allowed: false,
        reason: 'Asking price must be positive',
        maxAllowedPrice: faceValue,
      };
    }

    if (faceValue > 0) {
      // 10% maximum markup permitted for bus tickets
      const maxAllowed = Math.round(faceValue * 1.1);
      if (price > maxAllowed) {
        return {
          allowed: false,
          reason: `Bus ticket pricing policy: Maximum asking price is limited to 110% of face value (${maxAllowed} ${asset.currency || 'BDT'})`,
          maxAllowedPrice: maxAllowed,
        };
      }
      return { allowed: true, maxAllowedPrice: maxAllowed };
    }

    return { allowed: true, maxAllowedPrice: price };
  }

  isKycRequired(asset, askingPrice, seller = {}) {
    return Number(askingPrice) >= 3000;
  }

  checkTransferEligibility(asset, fromUser, toUser, context = {}) {
    const reasons = [];

    if (!this.isTransferable(asset)) {
      reasons.push('Bus ticket is marked non-transferable by operator');
    }

    // Must be transferred at least 2 hours before departure
    const depDate = asset.metadata?.departureDate;
    if (depDate) {
      const depTime = new Date(depDate).getTime();
      const now = Date.now();
      const twoHoursMs = 2 * 60 * 60 * 1000;
      if (!isNaN(depTime) && depTime - now < twoHoursMs) {
        reasons.push('Bus ticket transfers close 2 hours prior to scheduled departure');
      }
    }

    return {
      eligible: reasons.length === 0,
      reasons,
      reason: reasons.join(', '),
      policyCode: reasons.length > 0 ? 'OPERATOR_TRANSFER_POLICY_VIOLATION' : undefined,
    };
  }

  getProtectedFields() {
    return [
      'operator',
      'source',
      'destination',
      'route',
      'departureDate',
      'departureTime',
      'seatNumber',
      'busType',
      'originalValue',
      'currency',
    ];
  }
}
