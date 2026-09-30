import { Router } from 'express';
import { assetController } from './asset.controller.js';
import { authenticate } from '../auth/auth.middleware.js';
import { validate } from '../../common/middlewares/validate.middleware.js';
import { createAssetSchema, queryAssetsSchema } from './asset.validation.js';

const router = Router();

// Public / read routes
router.get('/', validate(queryAssetsSchema), assetController.list);
router.get('/:id', assetController.getById);

// Protected routes
router.use(authenticate);
router.post('/', validate(createAssetSchema), assetController.create);
router.get('/user/me', assetController.getMyAssets);

export const assetRoutes = router;
