import { z } from 'zod';

export const UserSchema = z.object({
  email: z.string().email('Invalid email format'),
  username: z.string().min(2, 'Username must be at least 2 characters'),
  displayName: z.string().min(2, 'Display name must be at least 2 characters'),
  hashedPassword: z
    .string()
    .min(6, 'Password must be at least 8 characters')
    .max(100, 'Password must be at most 100 characters'),
  avatarUrl: z.string().optional(),
  avatarId: z.string().optional(),
  bio: z.string().optional(),
  phone: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const SignUpBodySchema = UserSchema.pick({
  email: true,
  username: true,
  hashedPassword: true,
  displayName: true,
})
  .extend({
    confirmPassword: z.string().min(6).max(100),
  })
  .strict() // không cho phép thêm field mới ngoài những field đã được khai báo
  .superRefine(({ confirmPassword, hashedPassword }, ctx) => {
    if (confirmPassword !== hashedPassword) {
      ctx.addIssue({
        code: 'custom',
        message: 'Password and confirm password do not match',
        path: ['confirmPassword'],
      });
    }
  });

export const SignUpResponseSchema = UserSchema.omit({
  hashedPassword: true,
});

export type UserType = z.infer<typeof UserSchema>;
export type SignUpBodyType = z.infer<typeof SignUpBodySchema>;
export type SignUpResponseType = z.infer<typeof SignUpResponseSchema>;
