import { z } from 'zod';
import { ReviewDecisionType, RiskLevel } from './constants/fraud.constant.js';

export const reviewAssessmentSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Assessment ID is required'),
  }),
  body: z.object({
    decision: z.enum(Object.values(ReviewDecisionType)),
    notes: z.string().min(1, 'Review notes / rationale is required').max(1000),
  }),
});

export const assessAssetSchema = z.object({
  body: z.object({
    assetId: z.string().min(1, 'Asset ID is required'),
    context: z.record(z.any()).optional(),
  }),
});

export const queryAssessmentsSchema = z.object({
  query: z
    .object({
      riskLevel: z.enum(Object.values(RiskLevel)).optional(),
      status: z.string().optional(),
      targetType: z.string().optional(),
      page: z.string().regex(/^\d+$/).optional(),
      limit: z.string().regex(/^\d+$/).optional(),
    })
    .optional(),
});

export const assessmentIdParamSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Assessment ID is required'),
  }),
});
