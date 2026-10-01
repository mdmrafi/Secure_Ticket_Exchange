import { UnauthorizedError, ForbiddenError } from '../../common/errors/index.js';
import { getAuthProvider } from './auth.provider.factory.js';

/**
 * Authentication middleware: verifies JWT access token from Authorization header or cookie
 */
export const authenticate = async (req, res, next) => {
  try {
    let token = null;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      throw new UnauthorizedError(
        'Authentication token is missing. Please provide a valid Bearer token.'
      );
    }

    const provider = getAuthProvider();
    const userPayload = await provider.verifyToken(token);

    req.user = userPayload;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Role-Based Access Control (RBAC) middleware
 * Allowed roles: 'USER', 'ADMIN', 'MODERATOR'
 * @param {...string} allowedRoles
 */
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new UnauthorizedError('User authentication is required'));
    }

    const userRole = req.user.role;
    const userRoles = Array.isArray(req.user.roles) ? req.user.roles : userRole ? [userRole] : [];
    const hasRole = allowedRoles.some((role) => userRoles.includes(role));

    if (!hasRole) {
      return next(
        new ForbiddenError(
          `Forbidden. Requires one of the following roles: [${allowedRoles.join(', ')}]. Current role: ${userRole || 'NONE'}`
        )
      );
    }

    next();
  };
};
