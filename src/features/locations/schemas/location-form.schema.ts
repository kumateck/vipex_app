import { z } from 'zod';

const nonEmpty255 = z.string().min(1, 'Required').max(255);

export const createLocationSchema = z.object({
  name: nonEmpty255,
  telephone: z.string().trim().max(30, 'Telephone must be at most 30 characters'),
  canSend: z.boolean(),
  canReceive: z.boolean(),
  branchId: nonEmpty255,
});

export const editLocationSchema = z.object({
  name: nonEmpty255,
  telephone: z.string().trim().max(30, 'Telephone must be at most 30 characters'),
  canSend: z.boolean(),
  canReceive: z.boolean(),
});

export type CreateLocationFormValues = z.infer<typeof createLocationSchema>;
export type EditLocationFormValues = z.infer<typeof editLocationSchema>;
