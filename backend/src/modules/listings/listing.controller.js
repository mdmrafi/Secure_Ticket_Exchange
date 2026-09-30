import { listingService } from './listing.service.js';
import { ApiResponse } from '../../common/utils/api-response.js';
import { asyncHandler } from '../../common/utils/async-handler.js';

export class ListingController {
  constructor(service = listingService) {
    this.service = service;
  }

  create = asyncHandler(async (req, res) => {
    const listing = await this.service.createListing(req.user.userId, req.body);
    return ApiResponse.created(res, listing, 'Asset listed successfully for exchange');
  });

  getById = asyncHandler(async (req, res) => {
    const listing = await this.service.getListingById(req.params.id);
    return ApiResponse.success(res, listing, 'Listing details retrieved');
  });

  listActive = asyncHandler(async (req, res) => {
    const result = await this.service.listActiveListings(req.query);
    return ApiResponse.success(res, result.listings, 'Active listings retrieved', 200, result.pagination);
  });
}

export const listingController = new ListingController();
