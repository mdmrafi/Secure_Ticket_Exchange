import { listingRepository } from './listing.repository.js';
import { assetRepository } from '../assets/asset.repository.js';
import { User } from '../users/user.model.js';
import {
  NotFoundError,
  ForbiddenError,
  BadRequestError,
  ConflictError,
} from '../../common/errors/index.js';
import {
  AssetStatus,
  ListingStatus,
  VerificationStatus,
} from '../../common/constants/asset-types.constant.js';
import { KYCStatus } from '../kyc/kyc.constant.js';

// Protected ticket identity and asset fields that sellers are strictly prohibited from mutating
export const PROTECTED_TICKET_IDENTITY_FIELDS = [
  'assetId',
  'sellerId',
  'pnr',
  'ticketNumber',
  'uniqueAssetIdentifier',
  'passengerName',
  'source',
  'destination',
  'fromStation',
  'toStation',
  'from',
  'to',
  'trainNumber',
  'trainName',
  'seat',
  'seats',
  'coach',
  'class',
  'seatClass',
  'journeyDate',
  'departureDate',
  'departureTime',
  'eventDate',
  'venue',
  'barcode',
  'ticketId',
  'originalFaceValue',
  'originalValue',
  'currency',
  'extractedFields',
  'ocrConfidence',
  'documentUrl',
  'metadata',
  'documents',
];

export class ListingService {
  constructor(repo = listingRepository, assetRepo = assetRepository) {
    this.repo = repo;
    this.assetRepo = assetRepo;
  }

  /**
   * Create a new marketplace listing for a verified asset
   *
   * Business Rules Enforced:
   * 1. Suspended users cannot create listings
   * 2. Only asset owner can list the asset
   * 3. Suspicious or rejected assets cannot be listed
   * 4. Asset must meet verification requirements (VERIFIED or PASSED)
   * 5. Asset must be transferable
   * 6. Same asset cannot have multiple active/reserved listings
   * 7. High-trust listing identity requirements (KYC)
   *
   * @param {string} sellerId
   * @param {object} data
   */
  async createListing(sellerId, data) {
    // 1. Verify seller account status
    const seller = await User.findById(sellerId).select('accountStatus kycStatus role');
    if (!seller) {
      throw new NotFoundError('Seller account not found');
    }

    if (seller.accountStatus === 'SUSPENDED') {
      throw new ForbiddenError('Suspended users cannot create listings');
    }

    if (seller.accountStatus === 'DEACTIVATED') {
      throw new ForbiddenError('Deactivated user account cannot create listings');
    }

    // 2. Verify asset existence
    const asset = await this.assetRepo.findById(data.assetId);
    if (!asset) {
      throw new NotFoundError('Asset not found');
    }

    // 3. Rule: only asset owner can list
    const assetOwnerId = asset.ownerId?._id ? asset.ownerId._id.toString() : asset.ownerId.toString();
    if (assetOwnerId !== sellerId.toString()) {
      throw new ForbiddenError('You can only list assets that you own');
    }

    // 4. Rule: suspicious assets cannot be listed
    const isSuspicious =
      asset.verificationStatus === VerificationStatus.SUSPICIOUS ||
      asset.verificationStatus === VerificationStatus.FAILED ||
      asset.verificationStatus === VerificationStatus.FLAGGED ||
      asset.status === AssetStatus.REJECTED;

    if (isSuspicious) {
      throw new ForbiddenError('Suspicious or rejected assets cannot be listed on the marketplace');
    }

    // 5. Rule: asset must meet verification requirements
    const isVerified =
      asset.verificationStatus === VerificationStatus.VERIFIED ||
      asset.verificationStatus === VerificationStatus.PASSED ||
      asset.status === AssetStatus.VERIFIED;

    if (!isVerified) {
      throw new BadRequestError(
        `Asset must meet verification requirements before listing. Current status: ${asset.verificationStatus || asset.status}`
      );
    }

    // Check transferability
    if (asset.isTransferable === false) {
      throw new BadRequestError('Asset is non-transferable and cannot be listed on the marketplace');
    }

    // 6. Rule: same asset cannot have multiple active listings
    const existingActiveListing = await this.repo.findOne({
      assetId: asset._id,
      status: { $in: [ListingStatus.ACTIVE, ListingStatus.RESERVED, 'PENDING_ESCROW'] },
    });

    if (existingActiveListing) {
      throw new ConflictError('This asset already has an active or reserved listing on the marketplace');
    }

    // Validate expiration date if provided
    let expiresAt = data.expiresAt ? new Date(data.expiresAt) : null;
    if (expiresAt && expiresAt <= new Date()) {
      throw new BadRequestError('Expiration date must be in the future');
    }

    const askingPrice = data.askingPrice !== undefined ? data.askingPrice : data.price;
    if (askingPrice === undefined || askingPrice <= 0) {
      throw new BadRequestError('A valid positive asking price is required');
    }

    // 7. High-trust KYC listing verification guard
    const isHighTrust = data.isHighTrust || asset.metadata?.isHighTrust || askingPrice >= 5000;
    if (isHighTrust && seller.kycStatus !== KYCStatus.VERIFIED) {
      throw new ForbiddenError(
        'Identity verification required: You must complete KYC verification before you can create high-trust asset listings.'
      );
    }

    const status = data.status || ListingStatus.ACTIVE;

    // Create listing
    const listing = await this.repo.create({
      assetId: asset._id,
      sellerId,
      askingPrice,
      price: askingPrice,
      originalFaceValue: asset.originalValue || askingPrice,
      currency: data.currency || asset.currency || 'BDT',
      status,
      isEscrowProtected: data.isEscrowProtected !== undefined ? data.isEscrowProtected : true,
      expiresAt,
      notes: data.notes || '',
    });

    // Mark asset status as LISTED if active
    if (status === ListingStatus.ACTIVE) {
      await this.assetRepo.updateById(asset._id, { status: AssetStatus.LISTED });
    }

    return listing;
  }

  /**
   * Get single listing by ID
   * @param {string} id
   */
  async getListingById(id) {
    const listing = await this.repo.findById(id);
    if (!listing) {
      throw new NotFoundError('Listing not found');
    }
    return listing;
  }

  /**
   * List listings with multi-field search, asset metadata filtering, pagination, and sorting
   * @param {object} query
   */
  async listListings(query = {}) {
    const result = await this.repo.list(query);
    return {
      listings: result.items,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    };
  }

  /**
   * Backward-compatible alias for listListings
   * @param {object} query
   */
  async listActiveListings(query = {}) {
    return this.listListings(query);
  }

  /**
   * Update listing fields
   *
   * Business Rules Enforced:
   * 1. Only listing seller or admin can update
   * 2. Seller cannot modify protected ticket identity or ownership fields
   * 3. Cannot modify SOLD, EXPIRED, or CANCELLED listings
   * 4. State transitions validated
   *
   * @param {string} id
   * @param {string} userId
   * @param {object} updateData
   * @param {string} userRole
   */
  async updateListing(id, userId, updateData, userRole = 'USER') {
    // 1. Guard against modifications to protected ticket identity fields
    const attemptedProtected = PROTECTED_TICKET_IDENTITY_FIELDS.filter(
      (field) => field in updateData
    );

    if (attemptedProtected.length > 0) {
      throw new BadRequestError(
        `Modification of protected ticket identity or asset fields is strictly prohibited: [${attemptedProtected.join(', ')}]`
      );
    }

    // 2. Fetch existing listing
    const listing = await this.repo.findById(id);
    if (!listing) {
      throw new NotFoundError('Listing not found');
    }

    // 3. Ownership / authorization check
    const sellerIdStr = listing.sellerId?._id
      ? listing.sellerId._id.toString()
      : listing.sellerId.toString();

    const isOwner = sellerIdStr === userId.toString();
    const isAdmin = userRole === 'ADMIN';

    if (!isOwner && !isAdmin) {
      throw new ForbiddenError('You are not authorized to modify this listing');
    }

    // 4. Status checks on existing listing
    if (listing.status === ListingStatus.SOLD || listing.status === 'COMPLETED') {
      throw new BadRequestError('Cannot modify a listing that has already been sold');
    }

    if (listing.status === ListingStatus.CANCELLED) {
      throw new BadRequestError('Cannot modify a listing that has been cancelled');
    }

    if (listing.status === ListingStatus.EXPIRED) {
      throw new BadRequestError('Cannot modify a listing that has expired');
    }

    if (listing.status === ListingStatus.RESERVED && updateData.status && updateData.status !== ListingStatus.RESERVED) {
      if (!isAdmin) {
        throw new BadRequestError('Cannot modify a listing while an active escrow transaction is pending');
      }
    }

    // 5. Build sanitized update payload
    const safeUpdate = {};

    if (updateData.askingPrice !== undefined) {
      safeUpdate.askingPrice = updateData.askingPrice;
      safeUpdate.price = updateData.askingPrice;
    } else if (updateData.price !== undefined) {
      safeUpdate.askingPrice = updateData.price;
      safeUpdate.price = updateData.price;
    }

    if (updateData.notes !== undefined) {
      safeUpdate.notes = updateData.notes;
    }

    if (updateData.expiresAt !== undefined) {
      if (updateData.expiresAt) {
        const exp = new Date(updateData.expiresAt);
        if (exp <= new Date()) {
          throw new BadRequestError('Expiration date must be in the future');
        }
        safeUpdate.expiresAt = exp;
      } else {
        safeUpdate.expiresAt = null;
      }
    }

    if (updateData.status !== undefined) {
      // Validate transition
      if (listing.status === ListingStatus.DRAFT && updateData.status === ListingStatus.ACTIVE) {
        // When transitioning DRAFT -> ACTIVE, update asset status to LISTED
        const assetId = listing.assetId?._id || listing.assetId;
        await this.assetRepo.updateById(assetId, { status: AssetStatus.LISTED });
      } else if (updateData.status === ListingStatus.CANCELLED) {
        // When transitioning to CANCELLED, revert asset status back to VERIFIED
        const assetId = listing.assetId?._id || listing.assetId;
        await this.assetRepo.updateById(assetId, { status: AssetStatus.VERIFIED });
      }
      safeUpdate.status = updateData.status;
    }

    return this.repo.updateById(id, safeUpdate);
  }

  /**
   * Delete or cancel a listing
   *
   * Business Rules Enforced:
   * 1. Only listing seller or admin can delete/cancel
   * 2. Cannot delete a SOLD listing
   * 3. Reverts asset status back to VERIFIED
   *
   * @param {string} id
   * @param {string} userId
   * @param {string} userRole
   */
  async deleteListing(id, userId, userRole = 'USER') {
    const listing = await this.repo.findById(id);
    if (!listing) {
      throw new NotFoundError('Listing not found');
    }

    const sellerIdStr = listing.sellerId?._id
      ? listing.sellerId._id.toString()
      : listing.sellerId.toString();

    const isOwner = sellerIdStr === userId.toString();
    const isAdmin = userRole === 'ADMIN';

    if (!isOwner && !isAdmin) {
      throw new ForbiddenError('You are not authorized to cancel this listing');
    }

    if (listing.status === ListingStatus.SOLD || listing.status === 'COMPLETED') {
      throw new BadRequestError('Cannot delete or cancel a listing that has already been sold');
    }

    // Revert asset status back to VERIFIED so the owner can list or manage it again
    const assetId = listing.assetId?._id || listing.assetId;
    await this.assetRepo.updateById(assetId, { status: AssetStatus.VERIFIED });

    // Transition listing status to CANCELLED (or delete if DRAFT)
    if (listing.status === ListingStatus.DRAFT) {
      await this.repo.deleteById(id);
      return { _id: id, status: ListingStatus.CANCELLED, deleted: true };
    }

    const updated = await this.repo.updateById(id, { status: ListingStatus.CANCELLED });
    return updated;
  }
}

export const listingService = new ListingService();
