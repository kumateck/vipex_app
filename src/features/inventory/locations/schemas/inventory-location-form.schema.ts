import { z } from 'zod';

const nonEmpty255 = z.string().min(1, 'Required').max(255);
const optionalDescription = z.string().max(2000, 'Must be 2000 characters or less').optional().or(z.literal(''));

export const createInventoryLocationSchema = z.object({
  name: nonEmpty255,
  branchId: nonEmpty255,
  description: optionalDescription,
});

export const editInventoryLocationSchema = z.object({
  name: nonEmpty255,
  description: optionalDescription,
});

export type CreateInventoryLocationFormValues = z.infer<typeof createInventoryLocationSchema>;
export type EditInventoryLocationFormValues = z.infer<typeof editInventoryLocationSchema>;
