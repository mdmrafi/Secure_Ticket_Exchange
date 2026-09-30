import { Router } from 'express';
import { adminController } from './admin.controller.js';
import { authenticate, authorize } from '../auth/auth.middleware.js';
import { validate } from '../../common/middlewares/validate.middleware.js';
import { resolveReportSchema } from './admin.validation.js';

const router = Router();

// Strict RBAC: Admin only
router.use(authenticate, authorize('ADMIN'));

router.get('/metrics', adminController.getOverview);
router.patch('/reports/:id/resolve', validate(resolveReportSchema), adminController.resolveReport);

export const adminRoutes = router;
