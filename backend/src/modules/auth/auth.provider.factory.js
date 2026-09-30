import { env } from '../../config/env.config.js';
import { JwtAuthProvider } from './providers/jwt-auth.provider.js';
import { ClerkAuthProvider } from './providers/clerk-auth.provider.js';
import { logger } from '../../config/logger.config.js';

let instance = null;

export const getAuthProvider = () => {
  if (instance) return instance;

  if (env.AUTH_PROVIDER === 'clerk') {
    logger.info('Authentication provider initialized: Clerk');
    instance = new ClerkAuthProvider();
  } else {
    logger.info('Authentication provider initialized: JWT');
    instance = new JwtAuthProvider();
  }

  return instance;
};
