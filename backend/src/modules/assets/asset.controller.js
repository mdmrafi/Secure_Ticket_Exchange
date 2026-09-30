import { assetService } from './asset.service.js';
import { ApiResponse } from '../../common/utils/api-response.js';
import { asyncHandler } from '../../common/utils/async-handler.js';
import { HttpStatus } from '../../common/constants/http-status.constant.js';

export class AssetController {
  constructor(service = assetService) {
    this.service = service;
  }

  /**
   * POST /api/v1/assets
   * Create a new asset
   */
  create = asyncHandler(async (req, res) => {
    const asset = await this.service.createAsset(req.user.userId, req.body);
    return ApiResponse.created(res, asset, 'Asset created successfully');
  });

  /**
   * GET /api/v1/assets/:id
   * Get single asset by ID (with ownership authorization)
   */
  getById = asyncHandler(async (req, res) => {
    const asset = await this.service.getAssetById(req.params.id, req.user);
    return ApiResponse.success(res, asset, 'Asset details retrieved');
  });

  /**
   * GET /api/v1/assets/my
   * Retrieve assets owned exclusively by the authenticated user
   */
  getMyAssets = asyncHandler(async (req, res) => {
    const assets = await this.service.getMyAssets(req.user.userId, req.query);
    return ApiResponse.success(res, assets, 'My assets retrieved successfully');
  });

  /**
   * DELETE /api/v1/assets/:id
   * Delete an asset with strict ownership authorization
   */
  delete = asyncHandler(async (req, res) => {
    const result = await this.service.deleteAsset(req.params.id, req.user);
    return ApiResponse.success(res, result, 'Asset deleted successfully', HttpStatus.OK);
  });

  /**
   * PATCH /api/v1/assets/:id
   * Update an asset with strict ownership authorization
   */
  update = asyncHandler(async (req, res) => {
    const updated = await this.service.updateAsset(req.params.id, req.user, req.body);
    return ApiResponse.success(res, updated, 'Asset updated successfully');
  });

  /**
   * POST /api/v1/assets/railway/ingest
   * Upload railway ticket image/PDF and run through OCR ingestion pipeline
   */
  ingestRailwayTicket = asyncHandler(async (req, res) => {
    const file = req.uploadedTicketFile;
    const options = {
      ...req.body,
      ocrProvider: req.query.provider || req.body.provider,
    };

    const asset = await this.service.ingestRailwayTicket(req.user.userId, file, options);

    return ApiResponse.created(
      res,
      asset,
      'Railway ticket ingested and processed successfully'
    );
  });

  /**
   * GET /api/v1/assets/:id/document
   * Securely stream/download uploaded ticket document (owner/admin only)
   */
  getDocument = asyncHandler(async (req, res) => {
    const { filePath, filename } = await this.service.getAssetDocument(req.params.id, req.user);
    return res.download(filePath, filename);
  });

  /**
   * GET /api/v1/assets
   * List public / marketplace assets
   */
  list = asyncHandler(async (req, res) => {
    const result = await this.service.listAssets(req.query);
    return ApiResponse.success(
      res,
      result.assets,
      'Assets retrieved successfully',
      HttpStatus.OK,
      result.pagination
    );
  });
}

export const assetController = new AssetController();
