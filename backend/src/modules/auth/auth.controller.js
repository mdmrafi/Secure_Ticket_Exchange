import { authService } from './auth.service.js';
import { ApiResponse } from '../../common/utils/api-response.js';
import { asyncHandler } from '../../common/utils/async-handler.js';
import { env } from '../../config/env.config.js';

const getCookieOptions = () => {
  const isProduction = env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge: env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
    path: '/',
  };
};

export class AuthController {
  constructor(service = authService) {
    this.service = service;
  }

  register = asyncHandler(async (req, res) => {
    const clientInfo = {
      ip: req.ip,
      userAgent: req.get('user-agent'),
    };

    const result = await this.service.register(req.body, clientInfo);

    // Set refresh token in secure HTTP-only cookie
    res.cookie('refreshToken', result.tokens.refreshToken, getCookieOptions());

    return ApiResponse.created(res, result, 'User registered successfully');
  });

  login = asyncHandler(async (req, res) => {
    const clientInfo = {
      ip: req.ip,
      userAgent: req.get('user-agent'),
    };

    const result = await this.service.login(req.body, clientInfo);

    // Set refresh token in secure HTTP-only cookie
    res.cookie('refreshToken', result.tokens.refreshToken, getCookieOptions());

    return ApiResponse.success(res, result, 'Logged in successfully');
  });

  refresh = asyncHandler(async (req, res) => {
    const token = req.body?.refreshToken || req.cookies?.refreshToken;
    const clientInfo = {
      ip: req.ip,
      userAgent: req.get('user-agent'),
    };

    const result = await this.service.refreshSession(token, clientInfo);

    // Rotate refresh token cookie
    res.cookie('refreshToken', result.tokens.refreshToken, getCookieOptions());

    return ApiResponse.success(res, result, 'Session refreshed successfully');
  });

  logout = asyncHandler(async (req, res) => {
    const token = req.body?.refreshToken || req.cookies?.refreshToken;

    await this.service.logout(token);

    // Clear refresh cookie
    res.clearCookie('refreshToken', getCookieOptions());

    return ApiResponse.success(res, null, 'Logged out successfully');
  });

  getMe = asyncHandler(async (req, res) => {
    const user = await this.service.getCurrentUser(req.user.userId);
    return ApiResponse.success(res, user, 'Current user profile retrieved');
  });
}

export const authController = new AuthController();
