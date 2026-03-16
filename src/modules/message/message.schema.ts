import { MessageType } from '@/generated/prisma/enums';
import { z } from 'zod';

// Schema to send message (used for both REST and WebSocket)
export const SendMessageSchema = z
  .object({
    conversationId: z.string().uuid(),
    type: z.enum(MessageType).default('TEXT'),
    content: z.string().min(1).max(5000).optional(),
    fileUrl: z.string().url().optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (data.type === 'TEXT' && !data.content) {
      ctx.addIssue({
        code: 'custom',
        message: 'Text message requires content',
        path: ['content'],
      });
    }
    if (data.type === 'IMAGE' && !data.fileUrl) {
      ctx.addIssue({
        code: 'custom',
        message: 'Image message requires fileUrl',
        path: ['fileUrl'],
      });
    }
  });

export type SendMessageType = z.infer<typeof SendMessageSchema>;

// Schema query to get message history
export const GetMessagesQuerySchema = z.object({
  conversationId: z.string().uuid(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type GetMessagesQueryType = z.infer<typeof GetMessagesQuerySchema>;
