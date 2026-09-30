import { authService } from './auth.service.js';
import { ApiResponse } from '../../common/utils/api-response.js';
import { asyncHandler } from '../../common/utils/async-handler.js';
import { HttpStatus } from '../../common/constants/http-status.constant.js';

export class AuthController {
  constructor(service = authService) {
    this.service = service;
  }

  register = asyncHandler(async (req, res) => {
    const result = await this.service.register(req.body);
    return ApiResponse.created(res, result, 'Registration request received');
  });

  login = asyncHandler(async (req, res) => {
    const result = await this.service.login(req.body);
    return ApiResponse.success(res, result, 'Login request processed');
  });

  logout = asyncHandler(async (req, res) => {
    const result = await this.service.logout(req.user?.userId);
    return ApiResponse.success(res, result, 'Logout successful');
  });

  getMe = asyncHandler(async (req, res) => {
    const result = await this.service.getSession(req.user);
    return ApiResponse.success(res, result, 'Current session retrieved');
  });
}

export const authController = new AuthController();
