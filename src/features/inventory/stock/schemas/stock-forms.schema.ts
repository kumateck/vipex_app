import { z } from 'zod';

const requiredId = z.string().min(1, 'Required').max(255);
const optionalText = z.string().max(2000, 'Must be 2000 characters or less').optional().or(z.literal(''));
const optionalShortText = z.string().max(50, 'Must be 50 characters or less').optional().or(z.literal(''));
const optionalId = z.string().max(255).optional().or(z.literal(''));
const nonNegativeNumberString = z.string().regex(/^\d+(\.\d+)?$/, 'Must be a non-negative number');
const signedNumberString = z.string().regex(/^-?\d+(\.\d+)?$/, 'Must be a number');
const stockMovementType = z.number().int().min(0).max(4);
const stockAdjustmentReason = z.number().int().min(0).max(5);
const stockTransferStatus = z.number().int().min(0).max(3);

export const createStockMovementSchema = z.object({
  productId: requiredId,
  locationId: requiredId,
  movementType: stockMovementType,
  quantity: nonNegativeNumberString,
  referenceId: optionalId,
  referenceType: optionalShortText,
  notes: optionalText,
});

export const createStockAdjustmentSchema = z.object({
  productId: requiredId,
  locationId: requiredId,
  reason: stockAdjustmentReason,
  quantityChange: signedNumberString,
  notes: optionalText,
});

export const createStockTransferSchema = z
  .object({
    productId: requiredId,
    fromLocationId: requiredId,
    toLocationId: requiredId,
    quantity: nonNegativeNumberString,
    notes: optionalText,
  })
  .refine((values) => values.fromLocationId !== values.toLocationId, {
    message: 'Source and destination must be different',
    path: ['toLocationId'],
  });

export const updateStockTransferSchema = z.object({
  status: stockTransferStatus,
});

export type CreateStockMovementFormValues = z.infer<typeof createStockMovementSchema>;
export type CreateStockAdjustmentFormValues = z.infer<typeof createStockAdjustmentSchema>;
export type CreateStockTransferFormValues = z.infer<typeof createStockTransferSchema>;
export type UpdateStockTransferFormValues = z.infer<typeof updateStockTransferSchema>;
