import rateLimit from 'express-rate-limit';
import { env } from '../../config/env.config.js';
import { ApiResponse } from '../utils/api-response.js';
import { HttpStatus } from '../constants/http-status.constant.js';

export const globalRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.NODE_ENV === 'development' ? 5000 : env.RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Allow test suites to bypass global limiter when explicitly requested in non-production
    return env.NODE_ENV !== 'production' && req.headers['x-test-bypass-global-limit'] === 'true';
  },
  handler: (req, res) => {
    return ApiResponse.error(
      res,
      'Too many requests from this IP address. Please try again later.',
      HttpStatus.TOO_MANY_REQUESTS
    );
  },
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // strict limit for sensitive auth actions
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Allow non-rate-limit test suites to bypass auth limiter when explicitly requested in non-production
    return env.NODE_ENV !== 'production' && req.headers['x-test-bypass-auth-limit'] === 'true';
  },
  handler: (req, res) => {
    return ApiResponse.error(
      res,
      'Too many authentication attempts. Please try again after 15 minutes.',
      HttpStatus.TOO_MANY_REQUESTS
    );
  },
});
