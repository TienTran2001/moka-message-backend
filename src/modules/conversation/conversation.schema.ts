import { ConversationType } from '@/generated/prisma/enums';
import { z } from 'zod';

export const CreateConversationSchema = z
  .object({
    type: z.enum(ConversationType),
    memberIds: z.array(z.string().uuid()).min(1, 'At least 1 member required'),
    name: z.string().min(1).max(100).optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (data.type === 'DIRECT') {
      if (data.memberIds.length !== 1) {
        ctx.addIssue({
          code: 'custom',
          message: 'Direct conversation must have exactly 1 member',
          path: ['memberIds'],
        });
      }
    }

    if (data.type === 'GROUP') {
      if (!data.name) {
        ctx.addIssue({
          code: 'custom',
          message: 'Group conversation requires a name',
          path: ['name'],
        });
      }
    }
  });

export type CreateConversationType = z.infer<typeof CreateConversationSchema>;
