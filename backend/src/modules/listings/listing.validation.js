import { z } from 'zod';
import { ListingStatus } from '../../common/constants/asset-types.constant.js';

export const createListingSchema = z.object({
  body: z
    .object({
      assetId: z.string().min(1, 'Asset ID is required'),
      askingPrice: z.number().positive('Asking price must be greater than zero').optional(),
      price: z.number().positive('Price must be greater than zero').optional(),
      currency: z.string().max(10).optional().default('BDT'),
      status: z.enum(['DRAFT', 'ACTIVE']).optional().default('ACTIVE'),
      expiresAt: z.string().datetime().optional().nullable(),
      notes: z.string().max(1000, 'Notes cannot exceed 1000 characters').optional(),
      isEscrowProtected: z.boolean().optional().default(true),
      isHighTrust: z.boolean().optional(),
    })
    .refine((data) => data.askingPrice !== undefined || data.price !== undefined, {
      message: 'Either askingPrice or price must be specified and positive',
      path: ['askingPrice'],
    }),
});

export const updateListingSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Listing ID is required'),
  }),
  body: z
    .object({
      askingPrice: z.number().positive('Asking price must be greater than zero').optional(),
      price: z.number().positive('Price must be greater than zero').optional(),
      notes: z.string().max(1000, 'Notes cannot exceed 1000 characters').optional(),
      expiresAt: z.string().datetime().optional().nullable(),
      status: z.enum(['DRAFT', 'ACTIVE', 'CANCELLED', 'SUSPENDED']).optional(),
    })
    .passthrough(),
});

export const queryListingsSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/, 'Page must be an integer').optional(),
    limit: z.string().regex(/^\d+$/, 'Limit must be an integer').optional(),
    assetType: z.string().optional(),
    source: z.string().optional(),
    destination: z.string().optional(),
    date: z.string().optional(),
    minPrice: z
      .string()
      .regex(/^\d+(\.\d+)?$/, 'minPrice must be a valid number')
      .optional(),
    maxPrice: z
      .string()
      .regex(/^\d+(\.\d+)?$/, 'maxPrice must be a valid number')
      .optional(),
    verificationStatus: z.string().optional(),
    status: z.string().optional(),
    sortBy: z
      .enum(['price', 'askingPrice', 'createdAt', 'expiresAt', 'date', 'journeyDate'])
      .optional(),
    sortOrder: z.enum(['asc', 'desc', 'ASC', 'DESC']).optional(),
  }),
});

export const listingIdParamSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Listing ID is required'),
  }),
});

export const reserveListingSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Listing ID is required'),
  }),
  body: z
    .object({
      durationMinutes: z.number().int().min(1).max(60).optional().default(15),
    })
    .optional()
    .default({ durationMinutes: 15 }),
});

export const releaseListingSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Listing ID is required'),
  }),
  body: z
    .object({
      reason: z.string().max(500, 'Reason cannot exceed 500 characters').optional(),
    })
    .optional(),
});
