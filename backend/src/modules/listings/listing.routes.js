import { Router } from 'express';
import { listingController } from './listing.controller.js';
import { authenticate } from '../auth/auth.middleware.js';
import { validate } from '../../common/middlewares/validate.middleware.js';
import {
  createListingSchema,
  updateListingSchema,
  queryListingsSchema,
  listingIdParamSchema,
  reserveListingSchema,
  releaseListingSchema,
} from './listing.validation.js';

const router = Router();

// Public routes
router.get('/', validate(queryListingsSchema), listingController.list);
router.get('/:id', validate(listingIdParamSchema), listingController.getById);

// Protected routes (Require authenticated session)
router.use(authenticate);
router.post('/', validate(createListingSchema), listingController.create);
router.patch('/:id', validate(updateListingSchema), listingController.update);
router.delete('/:id', validate(listingIdParamSchema), listingController.delete);
router.post('/:id/reserve', validate(reserveListingSchema), listingController.reserve);
router.post('/:id/release', validate(releaseListingSchema), listingController.release);

export const listingRoutes = router;
