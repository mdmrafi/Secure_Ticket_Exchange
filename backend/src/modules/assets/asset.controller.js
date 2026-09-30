import { assetService } from './asset.service.js';
import { ApiResponse } from '../../common/utils/api-response.js';
import { asyncHandler } from '../../common/utils/async-handler.js';

export class AssetController {
  constructor(service = assetService) {
    this.service = service;
  }

  create = asyncHandler(async (req, res) => {
    const asset = await this.service.createAsset(req.user.userId, req.body);
    return ApiResponse.created(res, asset, 'Asset created successfully');
  });

  getById = asyncHandler(async (req, res) => {
    const asset = await this.service.getAssetById(req.params.id);
    return ApiResponse.success(res, asset, 'Asset details retrieved');
  });

  getMyAssets = asyncHandler(async (req, res) => {
    const assets = await this.service.getMyAssets(req.user.userId, req.query);
    return ApiResponse.success(res, assets, 'My assets retrieved');
  });

  list = asyncHandler(async (req, res) => {
    const result = await this.service.listAssets(req.query);
    return ApiResponse.success(res, result.assets, 'Assets retrieved successfully', 200, result.pagination);
  });
}

export const assetController = new AssetController();
