import { Router } from 'express';
import { assetController } from './asset.controller.js';
import { authenticate } from '../auth/auth.middleware.js';
import { validate } from '../../common/middlewares/validate.middleware.js';
import { ticketUploadMiddleware } from '../../common/middlewares/upload.middleware.js';
import { createAssetSchema, updateAssetSchema, queryAssetsSchema } from './asset.validation.js';

const router = Router();

// Public marketplace discovery route
router.get('/', validate(queryAssetsSchema), assetController.list);

// All user asset manipulation endpoints require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/assets/my
 * @desc    Retrieve assets belonging to the authenticated user
 * @access  Private
 */
router.get('/my', assetController.getMyAssets);
router.get('/user/me', assetController.getMyAssets); // Backward compatibility alias

/**
 * @route   POST /api/v1/assets/railway/ingest
 * @desc    Upload a railway ticket image/PDF and run OCR extraction
 * @access  Private
 */
router.post('/railway/ingest', ticketUploadMiddleware, assetController.ingestRailwayTicket);
router.post('/ingest', ticketUploadMiddleware, assetController.ingestRailwayTicket);

/**
 * @route   POST /api/v1/assets
 * @desc    Create a new asset (RailwayTicket, BusTicket, EventTicket, Document)
 * @access  Private
 */
router.post('/', validate(createAssetSchema), assetController.create);

/**
 * @route   GET /api/v1/assets/:id/document
 * @desc    Securely download/view the uploaded ticket document (owner/admin only)
 * @access  Private
 */
router.get('/:id/document', assetController.getDocument);

/**
 * @route   GET /api/v1/assets/:id
 * @desc    Retrieve single asset by ID (with ownership authorization check)
 * @access  Private
 */
router.get('/:id', assetController.getById);

/**
 * @route   PATCH /api/v1/assets/:id
 * @desc    Modify asset details (owner only)
 * @access  Private
 */
router.patch('/:id', validate(updateAssetSchema), assetController.update);

/**
 * @route   DELETE /api/v1/assets/:id
 * @desc    Delete asset (owner only)
 * @access  Private
 */
router.delete('/:id', assetController.delete);

export const assetRoutes = router;
