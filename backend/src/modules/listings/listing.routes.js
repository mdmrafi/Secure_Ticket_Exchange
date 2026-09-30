import { Router } from 'express';
import { listingController } from './listing.controller.js';
import { authenticate } from '../auth/auth.middleware.js';
import { validate } from '../../common/middlewares/validate.middleware.js';
import { createListingSchema, queryListingsSchema } from './listing.validation.js';

const router = Router();

// Public routes
router.get('/', validate(queryListingsSchema), listingController.listActive);
router.get('/:id', listingController.getById);

// Protected routes
router.use(authenticate);
router.post('/', validate(createListingSchema), listingController.create);

export const listingRoutes = router;
