import { z } from 'zod';

export const createInviteSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Circle ID is required'),
  }),
});

export const redeemInviteSchema = z.object({
  body: z.object({
    code: z
      .string()
      .trim()
      .min(6, 'Invite code must be at least 6 characters')
      .max(12, 'Invite code cannot exceed 12 characters'),
  }),
});
