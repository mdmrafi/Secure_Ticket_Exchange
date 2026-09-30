import { Router } from 'express';
import { reportController } from './report.controller.js';
import { authenticate } from '../auth/auth.middleware.js';
import { validate } from '../../common/middlewares/validate.middleware.js';
import { createReportSchema } from './report.validation.js';

const router = Router();

router.use(authenticate);

router.post('/', validate(createReportSchema), reportController.create);
router.get('/:id', reportController.getById);

export const reportRoutes = router;
