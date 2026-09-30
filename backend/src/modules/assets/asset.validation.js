import { z } from 'zod';
import { AssetTypes } from '../../common/constants/asset-types.constant.js';

export const createAssetSchema = z.object({
  body: z.object({
    assetType: z.nativeEnum(AssetTypes),
    title: z.string().min(3),
    description: z.string().optional(),
    uniqueAssetIdentifier: z.string().min(3, 'Unique identifier is required (e.g., PNR or ticket ID)'),
    originalValue: z.number().nonnegative().optional(),
    currency: z.string().default('BDT'),
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
