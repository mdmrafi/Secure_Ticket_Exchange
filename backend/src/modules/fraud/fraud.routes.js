import { Router } from 'express';
import { fraudController } from './fraud.controller.js';
import { authenticate, authorize } from '../auth/auth.middleware.js';
import { validate } from '../../common/middlewares/validate.middleware.js';
import {
  queryAssessmentsSchema,
  assessmentIdParamSchema,
  reviewAssessmentSchema,
  assessAssetSchema,
} from './fraud.validation.js';

const router = Router();

// Strict RBAC: All fraud review APIs require Admin authentication
router.use(authenticate, authorize('ADMIN'));

router.get(
  '/assessments',
  validate(queryAssessmentsSchema),
  fraudController.getAssessments
);

router.get(
  '/assessments/:id',
  validate(assessmentIdParamSchema),
  fraudController.getAssessmentById
);

router.post(
  '/assessments/:id/review',
  validate(reviewAssessmentSchema),
  fraudController.reviewAssessment
);

router.post(
  '/assess',
  validate(assessAssetSchema),
  fraudController.triggerAssessment
);

export const fraudRoutes = router;
