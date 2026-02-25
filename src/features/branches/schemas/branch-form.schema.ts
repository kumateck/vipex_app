import { z } from 'zod';

const nonEmpty255 = z.string().min(1, 'Required').max(255);
const optionalString255 = z.string().max(255).optional().or(z.literal(''));

export const branchFormSchema = z.object({
  name: nonEmpty255,
  type: nonEmpty255,
  telephone: optionalString255,
  address: optionalString255,
  email: z.union([z.string().email('Invalid email'), z.literal('')]).optional(),
});

export type BranchFormValues = z.infer<typeof branchFormSchema>;
