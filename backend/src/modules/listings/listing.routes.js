import { Router } from 'express';
import { listingController } from './listing.controller.js';
import { authenticate } from '../auth/auth.middleware.js';
import { validate } from '../../common/middlewares/validate.middleware.js';
import {
  createListingSchema,
  updateListingSchema,
  queryListingsSchema,
  listingIdParamSchema,
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

export const listingRoutes = router;
