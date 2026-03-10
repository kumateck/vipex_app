import { z } from 'zod';

const nonEmpty255 = z.string().min(1, 'Required').max(255);
const nonEmpty100 = z.string().min(1, 'Required').max(100);
const optionalDescription = z.string().max(2000, 'Must be 2000 characters or less').optional().or(z.literal(''));
const nonNegativeNumberString = z
  .string()
  .regex(/^\d+(\.\d+)?$/, 'Must be a non-negative number')
  .optional()
  .or(z.literal(''));
const unitOfMeasure = z.number().int().min(0).max(7);

export const createInventoryProductSchema = z.object({
  categoryId: z.string().optional().or(z.literal('')),
  sku: nonEmpty100,
  name: nonEmpty255,
  description: optionalDescription,
  unitOfMeasure,
  minStockLevel: nonNegativeNumberString,
});

export const editInventoryProductSchema = z.object({
  categoryId: z.string().optional().or(z.literal('')),
  sku: z.string().max(100).optional().or(z.literal('')),
  name: nonEmpty255,
  description: optionalDescription,
  unitOfMeasure,
  minStockLevel: nonNegativeNumberString,
});

export type CreateInventoryProductFormValues = z.infer<typeof createInventoryProductSchema>;
export type EditInventoryProductFormValues = z.infer<typeof editInventoryProductSchema>;
