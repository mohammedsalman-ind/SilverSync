import { z } from 'zod';

export const authSessionSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    timezone: z.string().min(1).default('Asia/Kolkata'),
    language: z.enum(['en', 'hi']).default('en'),
    seniorMode: z.boolean().default(false),
    fcmToken: z.string().optional(),
  }),
});

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    timezone: z.string().min(1).optional(),
    language: z.enum(['en', 'hi']).optional(),
    seniorMode: z.boolean().optional(),
    fcmToken: z.string().optional(),
  }),
});
