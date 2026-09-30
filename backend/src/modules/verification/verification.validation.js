import { z } from 'zod';

export const requestVerificationSchema = z.object({
  body: z.object({
    assetId: z.string().min(1, 'Asset ID is required'),
  }),
});
