import { Router } from 'express';
import { healthRoutes } from './health.routes.js';
import { authRoutes } from '../modules/auth/auth.routes.js';
import { userRoutes } from '../modules/users/user.routes.js';
import { assetRoutes } from '../modules/assets/asset.routes.js';
import { listingRoutes } from '../modules/listings/listing.routes.js';
import { transactionRoutes } from '../modules/transactions/transaction.routes.js';
import { verificationRoutes } from '../modules/verification/verification.routes.js';
import { notificationRoutes } from '../modules/notifications/notification.routes.js';
import { reportRoutes } from '../modules/reports/report.routes.js';
import { adminRoutes } from '../modules/admin/admin.routes.js';
import { kycRoutes } from '../modules/kyc/kyc.routes.js';
import { transferRoutes } from '../modules/transfers/transfer.routes.js';

const apiRouter = Router();

// Version 1 Routes
apiRouter.use('/health', healthRoutes);
apiRouter.use('/auth', authRoutes);
apiRouter.use('/users', userRoutes);
apiRouter.use('/assets', assetRoutes);
apiRouter.use('/listings', listingRoutes);
apiRouter.use('/transactions', transactionRoutes);
apiRouter.use('/transfers', transferRoutes);
apiRouter.use('/verification', verificationRoutes);
apiRouter.use('/kyc', kycRoutes);
apiRouter.use('/notifications', notificationRoutes);
apiRouter.use('/reports', reportRoutes);
apiRouter.use('/admin', adminRoutes);

export { apiRouter };

