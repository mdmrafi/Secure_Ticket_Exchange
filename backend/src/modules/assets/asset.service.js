import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { assetRepository } from './asset.repository.js';
import { createAssetDomain } from './types/index.js';
import { documentProcessor } from '../ocr/document-processor.js';
import { ExtractionStatus } from './constants/ingestion.constant.js';
import { NotFoundError, ConflictError, ForbiddenError, BadRequestError, UnauthorizedError } from '../../common/errors/index.js';
import { AssetTypes, AssetStatus, VerificationStatus } from '../../common/constants/asset-types.constant.js';
import { logger } from '../../config/logger.config.js';

export class AssetService {
  constructor(repo = assetRepository) {
    this.repo = repo;
  }

  /**
   * Create a new Asset
   * Uses generic Asset domain abstraction.
   *
   * @param {string} ownerId
   * @param {object} assetData
   */
  async createAsset(ownerId, assetData) {
    // 1. Instantiate typed domain model (RailwayTicket, BusTicket, EventTicket, Document)
    const domainAsset = createAssetDomain({
      ...assetData,
      ownerId,
      status: assetData.status || AssetStatus.DRAFT,
      verificationStatus: assetData.verificationStatus || VerificationStatus.NOT_REQUESTED,
    });

    // 2. Validate domain metadata
    const validation = domainAsset.validateMetadata();
    if (!validation.valid) {
      throw new BadRequestError(`Invalid asset metadata: ${validation.errors.join(', ')}`);
    }

    const payload = domainAsset.toPersistence();

    // 3. Prevent duplicate unique identifier for this asset type
    const existing = await this.repo.findByIdentifier(payload.assetType, payload.uniqueAssetIdentifier);
    if (existing) {
      throw new ConflictError(
        `An asset with identifier '${payload.uniqueAssetIdentifier}' is already registered under asset type '${payload.assetType}'`
      );
    }

    logger.info(
      { ownerId, assetType: payload.assetType, identifier: payload.uniqueAssetIdentifier },
      'Creating new asset'
    );

    return this.repo.create(payload);
  }

  /**
   * Get asset details by ID
   * Enforces strict ownership authorization for private/draft assets.
   *
   * @param {string} id
   * @param {object} [requestingUser]
   */
  async getAssetById(id, requestingUser = null) {
    const asset = await this.repo.findById(id);
    if (!asset) {
      throw new NotFoundError('Asset not found');
    }

    // Public access rule: Active or listed assets are viewable on marketplace
    const isPublic = asset.status === AssetStatus.LISTED;
    if (isPublic) {
      return asset;
    }

    // Private/Draft asset access rule: Requires authentication and ownership check
    if (!requestingUser) {
      throw new UnauthorizedError('Authentication is required to view this private asset');
    }

    const assetOwnerId = asset.ownerId?._id
      ? asset.ownerId._id.toString()
      : asset.ownerId.toString();
    const isOwner = assetOwnerId === requestingUser.userId.toString();
    const isAdmin = requestingUser.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      throw new ForbiddenError(
        'Forbidden: You are not authorized to view another user\'s private asset'
      );
    }

    return asset;
  }

  /**
   * Retrieve assets owned exclusively by the authenticated user
   *
   * @param {string} ownerId
   * @param {object} [query]
   */
  async getMyAssets(ownerId, query = {}) {
    const filter = {};
    if (query.assetType) filter.assetType = query.assetType;
    if (query.status) filter.status = query.status;

    return this.repo.findByOwner(ownerId, filter);
  }

  /**
   * Delete an asset
   * Enforces strict ownership authorization:
   * An authenticated user must never be able to modify or delete another user's asset.
   *
   * @param {string} id
   * @param {object} requestingUser
   */
  async deleteAsset(id, requestingUser) {
    if (!requestingUser) {
      throw new UnauthorizedError('Authentication is required to delete an asset');
    }

    const asset = await this.repo.findById(id);
    if (!asset) {
      throw new NotFoundError('Asset not found');
    }

    const assetOwnerId = asset.ownerId?._id
      ? asset.ownerId._id.toString()
      : asset.ownerId.toString();
    const isOwner = assetOwnerId === requestingUser.userId.toString();
    const isAdmin = requestingUser.role === 'ADMIN';

    // Strict ownership authorization guard
    if (!isOwner && !isAdmin) {
      throw new ForbiddenError(
        'Forbidden: You can only delete your own assets. Modifying another user\'s asset is strictly prohibited.'
      );
    }

    // Lifecycle state guard
    if (
      asset.status === AssetStatus.LISTED ||
      asset.status === AssetStatus.ESCROWED ||
      asset.status === AssetStatus.TRANSFERRED
    ) {
      throw new BadRequestError(
        `Cannot delete asset while in status '${asset.status}'. Please cancel any active listing or escrow first.`
      );
    }

    logger.info({ assetId: id, deletedBy: requestingUser.userId }, 'Asset deleted by owner');
    await this.repo.deleteById(id);

    return {
      success: true,
      message: 'Asset deleted successfully',
      deletedAssetId: id,
    };
  }

  /**
   * Modify/Update an asset
   * Enforces strict ownership authorization:
   * An authenticated user must never be able to modify another user's asset.
   *
   * @param {string} id
   * @param {object} requestingUser
   * @param {object} updateData
   */
  async updateAsset(id, requestingUser, updateData) {
    if (!requestingUser) {
      throw new UnauthorizedError('Authentication is required to modify an asset');
    }

    const asset = await this.repo.findById(id);
    if (!asset) {
      throw new NotFoundError('Asset not found');
    }

    const assetOwnerId = asset.ownerId?._id
      ? asset.ownerId._id.toString()
      : asset.ownerId.toString();
    const isOwner = assetOwnerId === requestingUser.userId.toString();
    const isAdmin = requestingUser.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      throw new ForbiddenError(
        'Forbidden: You can only modify your own assets. Modifying another user\'s asset is strictly prohibited.'
      );
    }

    if (asset.status === AssetStatus.TRANSFERRED || asset.status === AssetStatus.ESCROWED) {
      throw new BadRequestError(
        `Cannot modify asset while in status '${asset.status}'`
      );
    }

    return this.repo.updateById(id, updateData);
  }

  /**
   * Public marketplace query for listed assets
   *
   * @param {object} [query]
   */
  async listAssets(query = {}) {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const filter = {};
    if (query.assetType) filter.assetType = query.assetType;
    if (query.status) {
      filter.status = query.status;
    } else {
      // Default to listed/active assets for public query
      filter.status = AssetStatus.LISTED;
    }

    const { items, total } = await this.repo.list(filter, { skip, limit });

    return {
      assets: items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Ingest and process a railway ticket document (image/PDF)
   * Runs through DocumentProcessor -> OCRProvider -> RailwayTicketParser
   * Creates or updates a RailwayTicket asset with extracted fields.
   *
   * @param {string} ownerId
   * @param {object} file - Multer uploaded file metadata
   * @param {object} [options] - Additional parameters or test triggers
   */
  async ingestRailwayTicket(ownerId, file, options = {}) {
    if (!file || !file.path) {
      throw new BadRequestError('No ticket file provided for ingestion');
    }

    logger.info(
      { ownerId, originalFilename: file.originalname, size: file.size, mimetype: file.mimetype },
      'Ingesting railway ticket document'
    );

    // 1. Process document through OCR pipeline
    const ocrProcessing = await documentProcessor.processDocument({
      fileInput: file.path,
      mimeType: file.mimetype,
      originalFilename: file.originalname,
      assetType: AssetTypes.RAILWAY_TICKET,
      options,
    });

    const { extractionStatus, ocrConfidence, extractedFields, provider, processingNotes } = ocrProcessing;

    // 2. Generate unique identifier for the asset
    const randomSuffix = crypto.randomUUID().slice(0, 8);
    const pnr = extractedFields.pnr || options.pnr;
    const ticketNumber = extractedFields.ticketNumber || options.ticketNumber;
    let uniqueAssetIdentifier =
      pnr ? `RAIL-PNR-${pnr}` : (ticketNumber ? `RAIL-TKT-${ticketNumber}` : `RAIL-DOC-${Date.now()}-${randomSuffix}`);

    // If identifier already exists for another asset, ensure uniqueness with suffix
    const existing = await this.repo.findByIdentifier(AssetTypes.RAILWAY_TICKET, uniqueAssetIdentifier);
    if (existing) {
      uniqueAssetIdentifier = `${uniqueAssetIdentifier}-${randomSuffix}`;
    }

    // 3. Assemble RailwayTicket metadata
    const metadata = {
      ticketNumber: ticketNumber || uniqueAssetIdentifier,
      pnr: pnr || null,
      passengerName: extractedFields.passengerName || null,
      trainName: extractedFields.trainName || 'Intercity Express',
      trainNumber: extractedFields.trainNumber || null,
      source: extractedFields.source || 'Unknown Origin',
      destination: extractedFields.destination || 'Unknown Destination',
      journeyDate: extractedFields.journeyDate || null,
      departureTime: extractedFields.departureTime || null,
      coach: extractedFields.coach || null,
      seat: extractedFields.seat || null,
      class: extractedFields.class || 'Standard',
      fare: extractedFields.fare || 0,
      documentUrl: file.path,
      extractionStatus,
      ocrConfidence,
      extractedFields,
      ocrProvider: provider,
      ocrNotes: processingNotes,
      ingestedAt: new Date(),
    };

    // 4. Generate human-readable title
    let title = 'Railway Ticket';
    if (metadata.source && metadata.destination) {
      title = `Train ${metadata.trainNumber || ''}: ${metadata.source} -> ${metadata.destination}`.trim();
    } else if (metadata.pnr) {
      title = `Railway Ticket - PNR: ${metadata.pnr}`;
    }

    // 5. Create Asset in database
    // Note: Do not make any claim that OCR proves ticket authenticity.
    // verificationStatus remains NOT_REQUESTED; extractionStatus stores the extraction state.
    const assetPayload = {
      ownerId,
      assetType: AssetTypes.RAILWAY_TICKET,
      title,
      description: `Ingested railway ticket document (${file.originalname})`,
      uniqueAssetIdentifier,
      originalValue: metadata.fare || 0,
      currency: 'BDT',
      status: AssetStatus.DRAFT,
      verificationStatus: VerificationStatus.NOT_REQUESTED,
      documentUrl: file.path,
      extractionStatus,
      ocrConfidence,
      extractedFields,
      metadata,
      documents: [
        {
          url: file.path,
          documentType: 'RAILWAY_TICKET_ORIGINAL',
          fileHash: crypto.createHash('sha256').update(fs.readFileSync(file.path)).digest('hex'),
          uploadedAt: new Date(),
        },
      ],
    };

    const asset = await this.repo.create(assetPayload);

    logger.info(
      { assetId: asset._id, extractionStatus, ocrConfidence },
      'Railway ticket ingested and asset record created'
    );

    return asset;
  }

  /**
   * Securely retrieve the uploaded ticket file path for an asset
   * Enforces strict ownership authorization.
   *
   * @param {string} assetId
   * @param {object} requestingUser
   */
  async getAssetDocument(assetId, requestingUser) {
    if (!requestingUser) {
      throw new UnauthorizedError('Authentication is required to view asset documents');
    }

    const asset = await this.repo.findById(assetId);
    if (!asset) {
      throw new NotFoundError('Asset not found');
    }

    const assetOwnerId = asset.ownerId?._id
      ? asset.ownerId._id.toString()
      : asset.ownerId.toString();
    const isOwner = assetOwnerId === requestingUser.userId.toString();
    const isAdmin = requestingUser.role === 'ADMIN';

    // Strict ownership boundary: never expose another user's document
    if (!isOwner && !isAdmin) {
      throw new ForbiddenError(
        'Forbidden: You are not authorized to access document files of another user\'s asset.'
      );
    }

    const filePath = asset.documentUrl || asset.documents?.[0]?.url;
    if (!filePath || !fs.existsSync(filePath)) {
      throw new NotFoundError('Ticket document file not found on server storage');
    }

    return {
      filePath,
      filename: path.basename(filePath),
      asset,
    };
  }
}

export const assetService = new AssetService();
