import { TransferProvider } from './transfer-provider.interface.js';
import { AssetTypes } from '../../../common/constants/asset-types.constant.js';
import { TransferPolicy } from '../transfer.policy.js';

/**
 * MockTransferProvider
 *
 * Mock implementation of TransferProvider for testing and prototype workflows.
 * Supports configurable authorization flags, identity modification control,
 * and simulated external network / API failures for rollback testing.
 */
export class MockTransferProvider extends TransferProvider {
  /**
   * @param {object} [config]
   * @param {string} [config.providerId='MOCK_TRANSFER_PROVIDER']
   * @param {boolean} [config.isAuthorizedRailwayProvider=false]
   * @param {boolean} [config.supportsIdentityModification=false]
   * @param {boolean} [config.simulateFailure=false]
   * @param {string} [config.failureReason=null]
   * @param {string[]} [config.supportedTypes]
   */
  constructor(config = {}) {
    super(config.providerId || 'MOCK_TRANSFER_PROVIDER', config);
    this.isAuthorizedRailwayProvider = Boolean(config.isAuthorizedRailwayProvider);
    this.supportsIdentityModification = Boolean(config.supportsIdentityModification);
    this.simulateFailure = Boolean(config.simulateFailure);
    this.failureReason = config.failureReason || null;
    this.supportedTypes = config.supportedTypes || [
      AssetTypes.EVENT_TICKET,
      AssetTypes.BUS_TICKET,
      AssetTypes.OTHER,
    ];
  }

  /**
   * Toggle simulated failure for rollback/failure handling tests
   * @param {boolean} shouldFail
   * @param {string} [reason]
   */
  setSimulateFailure(shouldFail, reason = 'Simulated external transfer gateway failure') {
    this.simulateFailure = shouldFail;
    this.failureReason = shouldFail ? reason : null;
  }

  /**
   * Configure authorized railway provider status and identity modification support
   * @param {boolean} isAuthorized
   * @param {boolean} supportsIdMod
   */
  setAuthorizedRailway(isAuthorized = true, supportsIdMod = true) {
    this.isAuthorizedRailwayProvider = isAuthorized;
    this.supportsIdentityModification = supportsIdMod;
    if (isAuthorized && !this.supportedTypes.includes(AssetTypes.RAILWAY_TICKET)) {
      this.supportedTypes.push(AssetTypes.RAILWAY_TICKET);
    } else if (!isAuthorized) {
      this.supportedTypes = this.supportedTypes.filter((t) => t !== AssetTypes.RAILWAY_TICKET);
    }
  }

  /**
   * Check if asset is supported
   * @param {object} asset
   * @returns {boolean}
   */
  supports(asset) {
    if (!asset || !asset.assetType) return false;
    if (asset.assetType === AssetTypes.RAILWAY_TICKET) {
      return this.isAuthorizedRailwayProvider;
    }
    return this.supportedTypes.includes(asset.assetType);
  }

  /**
   * Execute simulated transfer
   *
   * @param {object} asset
   * @param {object} fromUser
   * @param {object} toUser
   * @param {object} [options]
   * @returns {Promise<{
   *   success: boolean,
   *   externalTransferId?: string,
   *   updatedMetadata?: object,
   *   providerResponse?: object,
   *   error?: string
   * }>}
   */
  async transfer(asset, fromUser, toUser, options = {}) {
    // 1. Check simulated failure toggle
    if (this.simulateFailure || options.simulateFailure) {
      const errorMsg =
        options.failureReason ||
        this.failureReason ||
        'Mock external provider error: transfer gateway rejected request';
      return {
        success: false,
        error: errorMsg,
        providerResponse: {
          code: 'EXTERNAL_GATEWAY_REJECTED',
          message: errorMsg,
          timestamp: new Date().toISOString(),
        },
      };
    }

    // 2. Strict railway identity check:
    // "The system must never modify railway identity information directly unless an authorized external provider explicitly supports it."
    if (TransferPolicy.isRailwayTicket(asset)) {
      const allowsModification = TransferPolicy.allowsIdentityModification(asset, this);
      if (options.modifyRailwayIdentity && !allowsModification) {
        return {
          success: false,
          error:
            'Forbidden: Railway passenger identity modification is not authorized for this provider',
          providerResponse: {
            code: 'RAILWAY_IDENTITY_MODIFICATION_FORBIDDEN',
            timestamp: new Date().toISOString(),
          },
        };
      }
    }

    // 3. Successful simulated transfer execution
    const externalTransferId = `txfer_mock_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Compute updated metadata (e.g. transfer badge, new attendee info)
    const updatedMetadata = {
      ...(asset.metadata || {}),
      lastTransferredAt: new Date().toISOString(),
      previousOwnerId: fromUser._id ? fromUser._id.toString() : fromUser.toString(),
      currentHolder: toUser.fullName || toUser.name || 'New Holder',
    };

    // If authorized railway provider supports identity modification, update passenger record cleanly
    if (TransferPolicy.isRailwayTicket(asset) && this.supportsIdentityModification) {
      updatedMetadata.passengerName = toUser.fullName || toUser.name || 'New Verified Passenger';
      if (toUser.nidNumber) {
        updatedMetadata.passengerNid = toUser.nidNumber;
      }
    }

    return {
      success: true,
      externalTransferId,
      updatedMetadata,
      providerResponse: {
        code: 'TRANSFER_SUCCESS',
        provider: this.providerId,
        externalTransferId,
        transferredAt: new Date().toISOString(),
      },
    };
  }
}
