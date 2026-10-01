import { listingService } from './listing.service.js';
import { ApiResponse } from '../../common/utils/api-response.js';
import { asyncHandler } from '../../common/utils/async-handler.js';

export class ListingController {
  constructor(service = listingService) {
    this.service = service;
  }

  /**
   * Create a new asset listing
   * POST /api/v1/listings
   */
  create = asyncHandler(async (req, res) => {
    const listing = await this.service.createListing(req.user.userId, req.body);
    return ApiResponse.created(res, listing, 'Asset listed successfully for exchange');
  });

  /**
   * Get listing details by ID
   * GET /api/v1/listings/:id
   */
  getById = asyncHandler(async (req, res) => {
    const listing = await this.service.getListingById(req.params.id);
    return ApiResponse.success(res, listing, 'Listing details retrieved');
  });

  /**
   * Search and filter listings with pagination and sorting
   * GET /api/v1/listings
   */
  list = asyncHandler(async (req, res) => {
    const result = await this.service.listListings(req.query);
    return ApiResponse.success(
      res,
      result.listings,
      'Listings retrieved successfully',
      200,
      result.pagination
    );
  });

  // Backward compatibility alias
  listActive = this.list;

  /**
   * Update listing details
   * PATCH /api/v1/listings/:id
   */
  update = asyncHandler(async (req, res) => {
    const listing = await this.service.updateListing(
      req.params.id,
      req.user.userId,
      req.body,
      req.user.role
    );
    return ApiResponse.success(res, listing, 'Listing updated successfully');
  });

  /**
   * Cancel or delete a listing
   * DELETE /api/v1/listings/:id
   */
  delete = asyncHandler(async (req, res) => {
    const listing = await this.service.deleteListing(
      req.params.id,
      req.user.userId,
      req.user.role
    );
    return ApiResponse.success(res, listing, 'Listing cancelled successfully');
  });
}

export const listingController = new ListingController();
