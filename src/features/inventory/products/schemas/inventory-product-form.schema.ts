import { z } from 'zod';

const nonEmpty255 = z.string().min(1, 'Required').max(255);
const nonEmpty100 = z.string().min(1, 'Required').max(100);
const optionalDescription = z
  .string()
  .max(2000, 'Must be 2000 characters or less')
  .optional()
  .or(z.literal(''));
const nonNegativeNumberString = z
  .string()
  .regex(/^\d+(\.\d+)?$/, 'Must be a non-negative number')
  .optional()
  .or(z.literal(''));
const unitOfMeasure = z.number().int().min(0).max(7);
const conversionFactor = z
  .string()
  .regex(/^\d+$/, 'Must be a whole number')
  .refine((value) => Number.parseInt(value, 10) > 1, 'Must be greater than 1');
const productUnitConversionSchema = z.object({
  unitOfMeasure,
  factorToBase: conversionFactor,
});

export const createInventoryProductSchema = z
  .object({
    categoryId: z.string().optional().or(z.literal('')),
    sku: nonEmpty100,
    name: nonEmpty255,
    description: optionalDescription,
    unitOfMeasure,
    isRecoverable: z.boolean().optional().default(false),
    unitConversions: z.array(productUnitConversionSchema).optional().default([]),
    minStockLevel: nonNegativeNumberString,
  })
  .superRefine((values, ctx) => {
    const unitSet = new Set<number>();
    const factorSet = new Set<number>([1]);
    const sortedFactors = values.unitConversions
      .map((item) => Number.parseInt(item.factorToBase, 10))
      .sort((a, b) => a - b);

    for (let i = 0; i < values.unitConversions.length; i += 1) {
      const item = values.unitConversions[i];
      if (item.unitOfMeasure === values.unitOfMeasure) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['unitConversions', i, 'unitOfMeasure'],
          message: 'Conversion unit cannot match base unit',
        });
      }
      if (unitSet.has(item.unitOfMeasure)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['unitConversions', i, 'unitOfMeasure'],
          message: 'Duplicate conversion unit',
        });
      }
      const factor = Number.parseInt(item.factorToBase, 10);
      if (factorSet.has(factor)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['unitConversions', i, 'factorToBase'],
          message: 'Duplicate conversion factor',
        });
      }
      unitSet.add(item.unitOfMeasure);
      factorSet.add(factor);
    }

    let previousFactor = 1;
    for (const factor of sortedFactors) {
      if (factor % previousFactor !== 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['unitConversions'],
          message: 'Conversion factors must form a divisible chain',
        });
        break;
      }
      previousFactor = factor;
    }
  });

export const editInventoryProductSchema = z
  .object({
    categoryId: z.string().optional().or(z.literal('')),
    sku: z.string().max(100).optional().or(z.literal('')),
    name: nonEmpty255,
    description: optionalDescription,
    unitOfMeasure,
    isRecoverable: z.boolean().optional().default(false),
    unitConversions: z.array(productUnitConversionSchema).optional().default([]),
    minStockLevel: nonNegativeNumberString,
  })
  .superRefine((values, ctx) => {
    const unitSet = new Set<number>();
    const factorSet = new Set<number>([1]);
    const sortedFactors = values.unitConversions
      .map((item) => Number.parseInt(item.factorToBase, 10))
      .sort((a, b) => a - b);

    for (let i = 0; i < values.unitConversions.length; i += 1) {
      const item = values.unitConversions[i];
      if (item.unitOfMeasure === values.unitOfMeasure) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['unitConversions', i, 'unitOfMeasure'],
          message: 'Conversion unit cannot match base unit',
        });
      }
      if (unitSet.has(item.unitOfMeasure)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['unitConversions', i, 'unitOfMeasure'],
          message: 'Duplicate conversion unit',
        });
      }
      const factor = Number.parseInt(item.factorToBase, 10);
      if (factorSet.has(factor)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['unitConversions', i, 'factorToBase'],
          message: 'Duplicate conversion factor',
        });
      }
      unitSet.add(item.unitOfMeasure);
      factorSet.add(factor);
    }

    let previousFactor = 1;
    for (const factor of sortedFactors) {
      if (factor % previousFactor !== 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['unitConversions'],
          message: 'Conversion factors must form a divisible chain',
        });
        break;
      }
      previousFactor = factor;
    }
  });

export type CreateInventoryProductFormValues = z.infer<typeof createInventoryProductSchema>;
export type EditInventoryProductFormValues = z.infer<typeof editInventoryProductSchema>;
