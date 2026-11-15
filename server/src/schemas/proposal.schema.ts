import { z } from 'zod';

export const proposalIdParamSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Proposal ID is required'),
  }),
});
