import { Router } from 'express';
import { adminController } from './admin.controller.js';
import { authenticate, authorize } from '../auth/auth.middleware.js';
import { validate } from '../../common/middlewares/validate.middleware.js';
import { resolveReportSchema } from './admin.validation.js';
import { fraudRoutes } from '../fraud/fraud.routes.js';

const router = Router();

// Strict RBAC: Admin only
router.use(authenticate, authorize('ADMIN'));

router.get('/metrics', adminController.getOverview);
router.patch('/reports/:id/resolve', validate(resolveReportSchema), adminController.resolveReport);

// Fraud Assessment and Admin Review APIs
router.use('/fraud', fraudRoutes);

export const adminRoutes = router;

