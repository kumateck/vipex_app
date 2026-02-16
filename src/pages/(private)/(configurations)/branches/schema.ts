import { z } from 'zod';

/** Shared string constraints to align with API (NonEmptyString255, etc.). */
const nonEmpty255 = z.string().min(1, 'Required').max(255);
const optionalString255 = z.string().max(255).optional().or(z.literal(''));

/** Schema for Create Branch form. Required: name, type. Optional: telephone, address, email. */
export const createBranchSchema = z.object({
  name: nonEmpty255,
  type: nonEmpty255,
  telephone: optionalString255,
  address: optionalString255,
  email: z.union([z.string().email('Invalid email'), z.literal('')]).optional(),
});

export type CreateBranchSchema = z.infer<typeof createBranchSchema>;

/** Schema for Edit Branch form (PATCH). All fields optional; name/type required for UX. */
export const editBranchSchema = z.object({
  name: nonEmpty255,
  type: nonEmpty255,
  telephone: optionalString255,
  address: optionalString255,
  email: z.union([z.string().email('Invalid email'), z.literal('')]).optional(),
});

export type EditBranchSchema = z.infer<typeof editBranchSchema>;
