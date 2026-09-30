import { userService } from './user.service.js';
import { ApiResponse } from '../../common/utils/api-response.js';
import { asyncHandler } from '../../common/utils/async-handler.js';

export class UserController {
  constructor(service = userService) {
    this.service = service;
  }

  getProfile = asyncHandler(async (req, res) => {
    const user = await this.service.getUserProfile(req.user.userId);
    return ApiResponse.success(res, user, 'User profile retrieved successfully');
  });

  updateProfile = asyncHandler(async (req, res) => {
    const user = await this.service.updateUserProfile(req.user.userId, req.body);
    return ApiResponse.success(res, user, 'User profile updated successfully');
  });

  listUsers = asyncHandler(async (req, res) => {
    const result = await this.service.listUsers(req.query);
    return ApiResponse.success(res, result.users, 'Users retrieved successfully', 200, result.pagination);
  });
}

export const userController = new UserController();
