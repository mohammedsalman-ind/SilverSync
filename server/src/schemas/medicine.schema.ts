import { z } from 'zod';

export const scheduleSchema = z.object({
  times: z
    .array(z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:mm)'))
    .min(1, 'At least one scheduled time is required'),
  daysOfWeek: z
    .array(z.number().int().min(0).max(6))
    .min(1, 'At least one day of the week is required'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be YYYY-MM-DD'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be YYYY-MM-DD').optional(),
});

export const createMedicineSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, 'Medicine name is required').max(100),
    dosage: z.string().trim().min(1, 'Dosage is required').max(50),
    form: z.string().trim().min(1, 'Form is required').max(50),
    schedule: scheduleSchema,
    asNeeded: z.boolean().default(false),
    quantityRemaining: z.number().min(0, 'Quantity remaining cannot be negative'),
    refillThresholdDays: z.number().int().min(1).default(7),
    notes: z.string().max(500).optional(),
  }),
});

export const updateMedicineSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Medicine ID is required'),
  }),
  body: z.object({
    name: z.string().trim().min(1).max(100).optional(),
    dosage: z.string().trim().min(1).max(50).optional(),
    form: z.string().trim().min(1).max(50).optional(),
    schedule: scheduleSchema.optional(),
    asNeeded: z.boolean().optional(),
    quantityRemaining: z.number().min(0).optional(),
    refillThresholdDays: z.number().int().min(1).optional(),
    notes: z.string().max(500).optional(),
  }),
});

export const refillMedicineSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Medicine ID is required'),
  }),
  body: z.object({
    quantity: z.number().min(0.5, 'Must refill at least 0.5 unit'),
  }),
});
