import { AssetTypes, AssetStatus, VerificationStatus } from '../../../common/constants/asset-types.constant.js';

/**
 * Base abstract domain class for all Assets in the system.
 * Foundation for:
 * Asset
 *  ├── RailwayTicket
 *  ├── BusTicket
 *  ├── EventTicket
 *  └── Document
 */
export class BaseAsset {
  constructor(data = {}) {
    this.ownerId = data.ownerId;
    this.assetType = data.assetType;
    this.status = data.status || AssetStatus.DRAFT;
    this.verificationStatus = data.verificationStatus || VerificationStatus.NOT_REQUESTED;
    this.metadata = data.metadata || {};
    this.title = data.title || '';
    this.description = data.description || '';
    this.uniqueAssetIdentifier = data.uniqueAssetIdentifier || this.generateUniqueIdentifier();
    this.originalValue = data.originalValue || 0;
    this.currency = data.currency || 'BDT';
    this.documents = data.documents || [];
    this.isTransferable = data.isTransferable !== false;
  }

  /**
   * Derive or generate a unique asset identifier if not explicitly provided
   * Subclasses can override to extract from domain metadata (e.g. PNR)
   */
  generateUniqueIdentifier() {
    return (
      this.metadata?.pnr ||
      this.metadata?.ticketNumber ||
      this.metadata?.uniqueIdentifier ||
      `${this.assetType}-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
    );
  }

  /**
   * Validate asset-type-specific metadata structure
   * @returns {{ valid: boolean, errors: string[] }}
   */
  validateMetadata() {
    return { valid: true, errors: [] };
  }

  /**
   * Summary presentation string for human-readable display
   */
  getSummary() {
    return `${this.assetType}: ${this.title || this.uniqueAssetIdentifier}`;
  }

  /**
   * Serialize into persistent database payload
   */
  toPersistence() {
    return {
      ownerId: this.ownerId,
      assetType: this.assetType,
      status: this.status,
      verificationStatus: this.verificationStatus,
      title: this.title || this.getSummary(),
      description: this.description,
      uniqueAssetIdentifier: this.uniqueAssetIdentifier,
      originalValue: this.originalValue,
      currency: this.currency,
      metadata: this.metadata,
      documents: this.documents,
      isTransferable: this.isTransferable,
    };
  }
}
