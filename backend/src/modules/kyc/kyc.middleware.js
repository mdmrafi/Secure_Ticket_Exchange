import { ForbiddenError, UnauthorizedError } from '../../common/errors/index.js';
import { User } from '../users/user.model.js';
import { KYCStatus } from './kyc.constant.js';

/**
 * Middleware: Enforces that a user has successfully completed identity verification (KYC)
 * Use on high-trust routes, such as creating high-value asset listings or initiating transactions.
 */
export const requireVerifiedKYC = async (req, res, next) => {
  try {
    if (!req.user || !req.user.userId) {
      throw new UnauthorizedError('Authentication is required to perform this action');
    }

    // Admins bypass KYC requirement
    if (req.user.role === 'ADMIN') {
      return next();
    }

    const user = await User.findById(req.user.userId).select('kycStatus');
    if (!user) {
      throw new UnauthorizedError('User account not found');
    }

    if (user.kycStatus !== KYCStatus.VERIFIED) {
      throw new ForbiddenError(
        'Identity verification required. You must verify your identity (KYC) before you can create high-trust asset listings.'
      );
    }

    next();
  } catch (error) {
    next(error);
  }
};
