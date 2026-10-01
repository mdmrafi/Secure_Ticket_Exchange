import { z } from 'zod';

export const requestTransferSchema = z.object({
  body: z.object({
    assetId: z.string().min(1, 'Asset ID is required'),
    fromUserId: z.string().min(1, 'fromUserId is required'),
    toUserId: z.string().min(1, 'toUserId is required'),
    transactionId: z.string().optional(),
    metadata: z.record(z.any()).optional(),
  }),
});

export const checkEligibilitySchema = z.object({
  params: z.object({
    assetId: z.string().min(1, 'Asset ID is required'),
  }),
  query: z
    .object({
      fromUserId: z.string().optional(),
      toUserId: z.string().optional(),
    })
    .optional(),
});

export const transferIdParamSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Transfer request ID is required'),
  }),
});

export const executeTransferSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Transfer request ID is required'),
  }),
  body: z
    .object({
      simulateFailure: z.boolean().optional(),
      modifyRailwayIdentity: z.boolean().optional(),
      failureReason: z.string().max(255).optional(),
    })
    .optional(),
});

export const rejectTransferSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Transfer request ID is required'),
  }),
  body: z
    .object({
      reason: z.string().min(1, 'Rejection reason is required').max(500),
    })
    .optional(),
});

export const cancelTransferSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Transfer request ID is required'),
  }),
  body: z
    .object({
      reason: z.string().max(500).optional(),
    })
    .optional(),
});
