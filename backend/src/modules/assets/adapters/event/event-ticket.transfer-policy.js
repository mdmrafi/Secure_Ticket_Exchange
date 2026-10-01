import { TransferPolicy } from '../interfaces/transfer-policy.interface.js';
import { AssetTypes } from '../../../../common/constants/asset-types.constant.js';

export class EventTicketTransferPolicy extends TransferPolicy {
  constructor() {
    super(AssetTypes.EVENT_TICKET);
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
    const faceValue = Number(asset.originalValue || asset.metadata?.originalFaceValue || 0);
    const price = Number(askingPrice);

    if (price <= 0) {
      return {
        allowed: false,
        reason: 'Asking price must be positive',
        maxAllowedPrice: faceValue,
      };
    }

    if (faceValue > 0) {
      // Maximum 20% markup cap on event tickets
      const maxAllowed = Math.round(faceValue * 1.2);
      if (price > maxAllowed) {
        return {
          allowed: false,
          reason: `Event anti-scalping policy: Maximum asking price cannot exceed 120% of face value (${maxAllowed} ${asset.currency || 'BDT'})`,
          maxAllowedPrice: maxAllowed,
        };
      }
      return { allowed: true, maxAllowedPrice: maxAllowed };
    }

    return { allowed: true, maxAllowedPrice: price };
  }

  isKycRequired(asset, askingPrice, seller = {}) {
    const isVip = (asset.metadata?.ticketTier || '').toUpperCase().includes('VIP');
    return Number(askingPrice) >= 5000 || isVip;
  }

  checkTransferEligibility(asset, fromUser, toUser, context = {}) {
    const reasons = [];

    if (!this.isTransferable(asset)) {
      reasons.push('Event organizer has prohibited secondary transfers for this pass');
    }

    // Must be transferred at least 4 hours before the event
    const eventDate = asset.metadata?.eventDate;
    if (eventDate) {
      const eTime = new Date(eventDate).getTime();
      const now = Date.now();
      const fourHoursMs = 4 * 60 * 60 * 1000;
      if (!isNaN(eTime) && eTime - now < fourHoursMs) {
        reasons.push('Event ticket transfer window closes 4 hours prior to door opening');
      }
    }

    return {
      eligible: reasons.length === 0,
      reasons,
      reason: reasons.join(', '),
      policyCode: reasons.length > 0 ? 'EVENT_TRANSFER_POLICY_VIOLATION' : undefined,
    };
  }

  getProtectedFields() {
    return [
      'eventName',
      'venue',
      'eventDate',
      'section',
      'row',
      'seat',
      'ticketTier',
      'organizer',
      'originalValue',
      'currency',
    ];
  }
}
