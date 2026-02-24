import { z } from 'zod';

/** Shared string constraints to align with API (NonEmptyString255, etc.). */
const nonEmpty255 = z.string().min(1, 'Required').max(255);

/** Schema for Create Location form. Required: name, branchId. */
export const createLocationSchema = z.object({
  name: nonEmpty255,
  branchId: nonEmpty255,
});

export type CreateLocationSchema = z.infer<typeof createLocationSchema>;

/** Schema for Edit Location form (PATCH). Only name is supported by API. */
export const editLocationSchema = z.object({
  name: nonEmpty255,
});

export type EditLocationSchema = z.infer<typeof editLocationSchema>;
