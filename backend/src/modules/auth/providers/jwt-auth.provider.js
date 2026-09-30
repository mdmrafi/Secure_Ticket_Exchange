import jwt from 'jsonwebtoken';
import { AuthProviderInterface } from './auth-provider.interface.js';
import { env } from '../../../config/env.config.js';
import { UnauthorizedError } from '../../../common/errors/index.js';

export class JwtAuthProvider extends AuthProviderInterface {
  async verifyToken(token) {
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET);
      return {
        userId: decoded.id || decoded.userId || decoded.sub,
        email: decoded.email,
        roles: decoded.roles || ['USER'],
        provider: 'jwt',
      };
    } catch (error) {
      throw new UnauthorizedError(error.message || 'Invalid or expired token');
    }
  }

  async generateTokens(payload) {
    const accessToken = jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN,
    });
    return { accessToken };
  }

  async revokeSession(token) {
    // In stateless JWT this is a no-op or handled via token blacklist repository
    return true;
  }
}
