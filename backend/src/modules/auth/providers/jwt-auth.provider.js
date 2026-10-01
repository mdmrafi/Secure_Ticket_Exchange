import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { AuthProviderInterface } from './auth-provider.interface.js';
import { env } from '../../../config/env.config.js';
import { UnauthorizedError } from '../../../common/errors/index.js';

export class JwtAuthProvider extends AuthProviderInterface {
  /**
   * Verify an incoming access token with strict algorithm pinning
   * @param {string} token
   * @returns {Promise<{ userId: string, email: string, role: string, provider: string }>}
   */
  async verifyToken(token) {
    try {
      // Pin algorithm to HS256 to prevent algorithm confusion attacks (e.g. 'none' algorithm or RSA/HMAC confusion)
      const decoded = jwt.verify(token, env.JWT_SECRET, {
        algorithms: ['HS256'],
      });
      return {
        userId: decoded.id || decoded.userId || decoded.sub,
        email: decoded.email,
        role: decoded.role || 'USER',
        provider: 'jwt',
      };
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedError('Access token has expired. Please refresh your session.');
      }
      throw new UnauthorizedError('Invalid authentication token');
    }
  }

  /**
   * Verify an incoming refresh token with strict algorithm pinning
   * @param {string} token
   * @returns {Promise<{ userId: string }>}
   */
  async verifyRefreshToken(token) {
    try {
      // Pin algorithm to HS256
      const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET, {
        algorithms: ['HS256'],
      });
      return {
        userId: decoded.id || decoded.userId || decoded.sub,
      };
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedError('Refresh token has expired. Please sign in again.');
      }
      throw new UnauthorizedError('Invalid refresh token');
    }
  }

  /**
   * Generate access token and refresh token pair
   * @param {{ id: string, email: string, role: string }} user
   * @returns {Promise<{ accessToken: string, refreshToken: string, expiresIn: string, refreshExpiresAt: Date }>}
   */
  async generateTokens(user) {
    const payload = {
      id: user.id || user._id,
      email: user.email,
      role: user.role,
    };

    const accessToken = jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_ACCESS_EXPIRES_IN,
      algorithm: 'HS256',
    });

    const refreshPayload = {
      id: user.id || user._id,
      // Random jti for entropy and uniqueness
      jti: crypto.randomBytes(16).toString('hex'),
    };

    const refreshToken = jwt.sign(refreshPayload, env.JWT_REFRESH_SECRET, {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN,
      algorithm: 'HS256',
    });

    // Parse refresh expiration into a future Date object for MongoDB TTL
    const refreshExpiresAt = this.calculateExpiryDate(env.JWT_REFRESH_EXPIRES_IN);

    return {
      accessToken,
      refreshToken,
      expiresIn: env.JWT_ACCESS_EXPIRES_IN,
      refreshExpiresAt,
    };
  }

  /**
   * Helper to parse duration strings like '7d', '24h', '30m' into a Date object
   * @param {string} durationStr
   * @returns {Date}
   */
  calculateExpiryDate(durationStr) {
    const match = durationStr.match(/^(\d+)([smhd])$/);
    const now = Date.now();
    if (!match) {
      // Default to 7 days
      return new Date(now + 7 * 24 * 60 * 60 * 1000);
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    const multipliers = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };

    return new Date(now + value * (multipliers[unit] || 24 * 60 * 60 * 1000));
  }
}

export const jwtAuthProvider = new JwtAuthProvider();
