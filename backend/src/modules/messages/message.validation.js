import { z } from 'zod';

export const sendMessageSchema = z.object({
  body: z.object({
    roomId: z.string().min(1, 'Room ID is required'),
    content: z.string().min(1, 'Message content cannot be empty').max(2000),
    recipientId: z.string().optional(),
    metadata: z.record(z.any()).optional(),
  }),
});

export const getHistorySchema = z.object({
  query: z.object({
    roomId: z.string().min(1, 'Room ID is required'),
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional(),
  }),
});

export const messageIdParamSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Message ID is required'),
  }),
});
