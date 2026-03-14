import { z } from 'zod';

// Body cho send request, accept, reject, unfriend
export const FriendIdParamSchema = z.object({
  friendId: z.string().uuid('Invalid friend ID'),
});

// Query cho list endpoints
export const FriendshipQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export type FriendIdParamType = z.infer<typeof FriendIdParamSchema>;
export type FriendshipQueryType = z.infer<typeof FriendshipQuerySchema>;
