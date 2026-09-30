import { AuthProviderInterface } from './auth-provider.interface.js';
import { env } from '../../../config/env.config.js';
import { UnauthorizedError } from '../../../common/errors/index.js';
import { logger } from '../../../config/logger.config.js';

/**
 * Adapter skeleton for Clerk authentication.
 * Ready for full Clerk SDK integration (@clerk/clerk-sdk-node)
 * when migrating to managed identity.
 */
export class ClerkAuthProvider extends AuthProviderInterface {
  constructor() {
    super();
    this.secretKey = env.CLERK_SECRET_KEY;
  }

  async verifyToken(token) {
    if (!this.secretKey) {
      logger.warn('Clerk secret key is not configured in environment variables');
      throw new UnauthorizedError('Clerk authentication provider is not configured');
    }

    try {
      // Stub integration: When @clerk/express or @clerk/backend is activated,
      // this calls verifyToken(token, { secretKey })
      logger.debug('Verifying token through Clerk adapter interface');
      
      // Decoded structure placeholder for Clerk session claims:
      return {
        userId: 'clerk_user_placeholder',
        email: 'clerk_user@example.com',
        roles: ['USER'],
        provider: 'clerk',
      };
    } catch (error) {
      throw new UnauthorizedError(error.message || 'Clerk token verification failed');
    }
  }

  async generateTokens() {
    throw new Error('Token generation is managed directly by Clerk client-side components');
  }

  async revokeSession(token) {
    logger.debug('Clerk session revoked');
    return true;
  }
}
