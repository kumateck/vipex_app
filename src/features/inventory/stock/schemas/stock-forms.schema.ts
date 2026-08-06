import { z } from 'zod';

const requiredId = z.string().min(1, 'Required').max(255);
const optionalText = z
  .string()
  .max(2000, 'Must be 2000 characters or less')
  .optional()
  .or(z.literal(''));
const optionalShortText = z
  .string()
  .max(50, 'Must be 50 characters or less')
  .optional()
  .or(z.literal(''));
const optionalId = z.string().max(255).optional().or(z.literal(''));
const nonNegativeNumberString = z.string().regex(/^\d+(\.\d+)?$/, 'Must be a non-negative number');
const signedNumberString = z.string().regex(/^-?\d+(\.\d+)?$/, 'Must be a number');
const positiveIntegerString = z
  .string()
  .regex(/^\d+$/, 'Must be a whole number')
  .refine((value) => Number.parseInt(value, 10) > 0, 'Must be greater than zero');
const stockMovementType = z.number().int().min(0).max(4);
const stockAdjustmentReason = z.number().int().min(0).max(5);
const stockTransferStatus = z.number().int().min(0).max(4);
const stockRequestStatus = z.number().int().min(0).max(6);
const maintenanceIssueType = z.number().int().min(0).max(2);
const unitOfMeasure = z.number().int().min(0).max(7);
const optionalNonNegativeIntegerString = z
  .string()
  .regex(/^\d+$/, 'Must be a non-negative whole number')
  .optional()
  .or(z.literal(''));

export const createStockMovementSchema = z.object({
  productId: requiredId,
  locationId: requiredId,
  movementType: stockMovementType,
  quantityUnitOfMeasure: unitOfMeasure.optional(),
  quantity: nonNegativeNumberString,
  referenceId: optionalId,
  referenceType: optionalShortText,
  notes: optionalText,
});

export const createStockAdjustmentSchema = z.object({
  productId: requiredId,
  locationId: requiredId,
  reason: stockAdjustmentReason,
  quantityUnitOfMeasure: unitOfMeasure.optional(),
  quantityChange: signedNumberString,
  notes: optionalText,
});

export const createStockTransferSchema = z
  .object({
    productId: requiredId,
    fromLocationId: requiredId,
    toLocationId: requiredId,
    quantityUnitOfMeasure: unitOfMeasure.optional(),
    quantity: nonNegativeNumberString,
    notes: optionalText,
  })
  .refine((values) => values.fromLocationId !== values.toLocationId, {
    message: 'Source and destination must be different',
    path: ['toLocationId'],
  });

export const updateStockTransferSchema = z
  .object({
    status: stockTransferStatus.optional(),
    fulfillQuantity: optionalNonNegativeIntegerString,
  })
  .refine((values) => values.status !== undefined || !!values.fulfillQuantity, {
    message: 'Provide a status or fulfillment quantity',
    path: ['status'],
  });

export const createStockRequestSchema = z.object({
  requesterLocationId: requiredId,
  requestedToLocationId: optionalId,
  requestType: z.number().int().min(0).max(1),
  notes: optionalText,
  submit: z.boolean().optional(),
  lines: z
    .array(
      z.object({
        productId: requiredId,
        quantityUnitOfMeasure: unitOfMeasure.optional(),
        requestedQuantity: positiveIntegerString,
        notes: optionalText,
      }),
    )
    .min(1, 'At least one line is required'),
});

export const rejectStockRequestSchema = z.object({
  reason: optionalText,
});

export const fulfillStockRequestLineSchema = z.object({
  lineId: requiredId,
  fromLocationId: requiredId,
  fulfillQuantity: positiveIntegerString,
  fulfillQuantityUnitOfMeasure: unitOfMeasure.optional(),
  notes: optionalText,
});

export const acknowledgeStockRequestLineSchema = z.object({
  lineId: requiredId,
  acknowledgedQuantity: positiveIntegerString,
  notes: optionalText,
});

export const acknowledgeStockRequestLineReceiptSchema = z
  .object({
    lineId: requiredId,
    receiveMode: z.enum(['full', 'partial']),
    partialReceivedQuantity: optionalNonNegativeIntegerString,
    partialQuantityUnitOfMeasure: unitOfMeasure.optional(),
    damagedQuantity: optionalNonNegativeIntegerString,
    damagedQuantityUnitOfMeasure: unitOfMeasure.optional(),
    missingQuantity: optionalNonNegativeIntegerString,
    missingQuantityUnitOfMeasure: unitOfMeasure.optional(),
    notes: optionalText,
  })
  .refine(
    (values) => {
      if (values.receiveMode === 'full') return true;
      return (
        !!values.partialReceivedQuantity && Number.parseInt(values.partialReceivedQuantity, 10) > 0
      );
    },
    {
      message: 'Partial received quantity must be greater than zero',
      path: ['partialReceivedQuantity'],
    },
  );

export const acknowledgeStockTransferReceiptSchema = z
  .object({
    receiveMode: z.enum(['full', 'partial']),
    partialReceivedQuantity: optionalNonNegativeIntegerString,
    partialQuantityUnitOfMeasure: unitOfMeasure.optional(),
    damagedQuantity: optionalNonNegativeIntegerString,
    damagedQuantityUnitOfMeasure: unitOfMeasure.optional(),
    missingQuantity: optionalNonNegativeIntegerString,
    missingQuantityUnitOfMeasure: unitOfMeasure.optional(),
    notes: optionalText,
  })
  .refine(
    (values) => {
      if (values.receiveMode === 'full') return true;
      return (
        !!values.partialReceivedQuantity && Number.parseInt(values.partialReceivedQuantity, 10) > 0
      );
    },
    {
      message: 'Partial received quantity must be greater than zero',
      path: ['partialReceivedQuantity'],
    },
  );

export const updateStockRequestStatusSchema = z.object({
  status: stockRequestStatus,
});

export const createStockMaintenanceSchema = z.object({
  productId: requiredId,
  locationId: requiredId,
  issueType: maintenanceIssueType,
  quantity: positiveIntegerString,
  notes: optionalText,
});

export const resolveStockMaintenanceSchema = z.object({
  quantityReturned: optionalNonNegativeIntegerString,
  quantityDisposed: optionalNonNegativeIntegerString,
  notes: optionalText,
});

export type CreateStockMovementFormValues = z.infer<typeof createStockMovementSchema>;
export type CreateStockAdjustmentFormValues = z.infer<typeof createStockAdjustmentSchema>;
export type CreateStockTransferFormValues = z.infer<typeof createStockTransferSchema>;
export type UpdateStockTransferFormValues = z.infer<typeof updateStockTransferSchema>;
export type CreateStockRequestFormValues = z.infer<typeof createStockRequestSchema>;
export type RejectStockRequestFormValues = z.infer<typeof rejectStockRequestSchema>;
export type FulfillStockRequestLineFormValues = z.infer<typeof fulfillStockRequestLineSchema>;
export type StockRequestLineAcknowledgeFormValues = z.infer<
  typeof acknowledgeStockRequestLineSchema
>;
export type StockRequestLineReceiptAcknowledgeFormValues = z.infer<
  typeof acknowledgeStockRequestLineReceiptSchema
>;
export type AcknowledgeStockTransferReceiptFormValues = z.infer<
  typeof acknowledgeStockTransferReceiptSchema
>;
export type UpdateStockRequestStatusFormValues = z.infer<typeof updateStockRequestStatusSchema>;
export type CreateStockMaintenanceFormValues = z.infer<typeof createStockMaintenanceSchema>;
export type ResolveStockMaintenanceFormValues = z.infer<typeof resolveStockMaintenanceSchema>;
