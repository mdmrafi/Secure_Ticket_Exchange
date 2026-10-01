import { z } from 'zod';
import { AssetTypes, AssetStatus } from '../../common/constants/asset-types.constant.js';
import { hasAssetAdapter, getSupportedAssetTypes } from './adapters/index.js';

export const createAssetSchema = z.object({
  body: z.object({
    assetType: z
      .string()
      .min(1, 'Asset type is required')
      .refine(
        (val) => hasAssetAdapter(val) || Object.values(AssetTypes).includes(val),
        (val) => ({
          message: `Invalid asset type '${val}'. Supported types: ${getSupportedAssetTypes().join(', ')}`,
        })
      ),
    title: z.string().min(1, 'Title cannot be empty').optional(),
    description: z.string().optional(),
    uniqueAssetIdentifier: z.string().min(1, 'Identifier cannot be empty').optional(),
    originalValue: z
      .number()
      .nonnegative('Original value must be greater than or equal to zero')
      .optional(),
    currency: z.string().optional().default('BDT'),
    metadata: z.record(z.any()).optional().default({}),
  }),
});

export const updateAssetSchema = z.object({
  body: z.object({
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    originalValue: z.number().nonnegative().optional(),
    currency: z.string().optional(),
    metadata: z.record(z.any()).optional(),
  }),
});

export const queryAssetsSchema = z.object({
  query: z.object({
    assetType: z.string().optional(),
    status: z.string().optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
});
