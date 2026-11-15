import { z } from 'zod';

export const logDoseSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Dose log ID is required'),
  }),
  body: z.object({
    status: z.enum(['taken', 'skipped']),
  }),
});

export const todayDosesQuerySchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Circle ID is required'),
  }),
  query: z.object({
    timezone: z.string().default('Asia/Kolkata'),
  }),
});
