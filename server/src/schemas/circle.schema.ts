import { z } from 'zod';

export const createCircleSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2, 'Circle name must be at least 2 characters').max(50),
  }),
});

export const circleIdParamSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Circle ID is required'),
  }),
});

export const memberUidParamSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Circle ID is required'),
    uid: z.string().min(1, 'Member UID is required'),
  }),
});

export const updateMemberSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Circle ID is required'),
    uid: z.string().min(1, 'Member UID is required'),
  }),
  body: z.object({
    role: z.enum(['FAMILY', 'CAREGIVER']).optional(),
    permissions: z
      .array(z.enum(['view_only', 'manage_medicines', 'manage_appointments']))
      .min(1, 'At least one permission is required')
      .optional(),
    status: z.enum(['active', 'revoked']).optional(),
  }),
});
