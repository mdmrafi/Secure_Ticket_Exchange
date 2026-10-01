import { getAuthProvider } from '../../auth/auth.provider.factory.js';
import { logger } from '../../../config/logger.config.js';

/**
 * Socket.IO Authentication Middleware
 *
 * Enforces:
 * 1. Derives user identity strictly from cryptographic JWT verification.
 * 2. Never trusts any client-supplied userId.
 * 3. Rejects unauthenticated connections immediately.
 */
export const socketAuthMiddleware = async (socket, next) => {
  try {
    let token = null;

    // 1. Check handshake.auth (standard modern Socket.IO client authentication)
    if (socket.handshake.auth && socket.handshake.auth.token) {
      token = socket.handshake.auth.token;
    }

    // 2. Check authorization header
    if (!token && socket.handshake.headers && socket.handshake.headers.authorization) {
      const authHeader = socket.handshake.headers.authorization;
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      } else {
        token = authHeader;
      }
    }

    // 3. Check query string fallback
    if (!token && socket.handshake.query && socket.handshake.query.token) {
      token = socket.handshake.query.token;
    }

    if (!token) {
      logger.warn({ socketId: socket.id }, 'Socket connection rejected: No authentication token provided');
      return next(new Error('Authentication error: Missing authentication token'));
    }

    const provider = getAuthProvider();
    const userPayload = await provider.verifyToken(token);

    if (!userPayload || (!userPayload.userId && !userPayload.id)) {
      logger.warn({ socketId: socket.id }, 'Socket connection rejected: Invalid token payload');
      return next(new Error('Authentication error: Invalid or expired token'));
    }

    const userId = (userPayload.userId || userPayload.id).toString();

    // Attach verified user identity directly to the socket instance
    socket.user = {
      id: userId,
      userId,
      email: userPayload.email,
      role: userPayload.role || 'USER',
      name: userPayload.name,
    };

    logger.debug({ socketId: socket.id, userId }, 'Socket connection authenticated successfully');
    return next();
  } catch (error) {
    logger.warn({ socketId: socket.id, err: error.message }, 'Socket authentication failed');
    return next(new Error(`Authentication error: ${error.message}`));
  }
};
