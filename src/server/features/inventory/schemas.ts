import { t } from 'elysia';
import { UUID, NonEmptyString255, PaginationRequestQueryProps, SmallInt } from '../../schemas/common';

// Product Category schemas
export const ListProductCategoriesQuery = t.Object({
  ...PaginationRequestQueryProps,
  companyId: t.Optional(UUID),
});

export const CreateProductCategoryBody = t.Object({
  companyId: UUID,
  name: NonEmptyString255,
  description: t.Optional(t.String()),
  createdBy: UUID,
});

export const UpdateProductCategoryBody = t.Object({
  name: t.Optional(NonEmptyString255),
  description: t.Optional(t.Union([t.String(), t.Null()])),
});

// Product schemas
export const ListProductsQuery = t.Object({
  ...PaginationRequestQueryProps,
  companyId: t.Optional(UUID),
  categoryId: t.Optional(UUID),
});

export const CreateProductBody = t.Object({
  companyId: UUID,
  categoryId: t.Optional(UUID),
  sku: t.String({ minLength: 1, maxLength: 100 }),
  name: NonEmptyString255,
  description: t.Optional(t.String()),
  unitOfMeasure: SmallInt,
  minStockLevel: t.Optional(t.String()), // bigint as string
  createdBy: UUID,
});

export const UpdateProductBody = t.Object({
  categoryId: t.Optional(t.Union([UUID, t.Null()])),
  name: t.Optional(NonEmptyString255),
  description: t.Optional(t.Union([t.String(), t.Null()])),
  unitOfMeasure: t.Optional(SmallInt),
  minStockLevel: t.Optional(t.String()), // bigint as string
});

// Inventory Location schemas
export const ListInventoryLocationsQuery = t.Object({
  ...PaginationRequestQueryProps,
  companyId: t.Optional(UUID),
  branchId: t.Optional(UUID),
});

export const CreateInventoryLocationBody = t.Object({
  companyId: UUID,
  branchId: UUID,
  name: NonEmptyString255,
  description: t.Optional(t.String()),
  createdBy: UUID,
});

export const UpdateInventoryLocationBody = t.Object({
  name: t.Optional(NonEmptyString255),
  description: t.Optional(t.Union([t.String(), t.Null()])),
});

// Stock Level schemas
export const ListStockLevelsQuery = t.Object({
  ...PaginationRequestQueryProps,
  companyId: t.Optional(UUID),
  productId: t.Optional(UUID),
  locationId: t.Optional(UUID),
});

export const UpdateStockLevelBody = t.Object({
  quantity: t.String(), // bigint as string
});

// Stock Movement schemas
export const ListStockMovementsQuery = t.Object({
  ...PaginationRequestQueryProps,
  companyId: t.Optional(UUID),
  productId: t.Optional(UUID),
  locationId: t.Optional(UUID),
  movementType: t.Optional(SmallInt),
});

export const CreateStockMovementBody = t.Object({
  companyId: UUID,
  productId: UUID,
  locationId: UUID,
  movementType: SmallInt,
  quantity: t.String(), // bigint as string
  referenceId: t.Optional(UUID),
  referenceType: t.Optional(t.String({ maxLength: 50 })),
  notes: t.Optional(t.String()),
  createdBy: UUID,
});

// Stock Adjustment schemas
export const ListStockAdjustmentsQuery = t.Object({
  ...PaginationRequestQueryProps,
  companyId: t.Optional(UUID),
  productId: t.Optional(UUID),
  locationId: t.Optional(UUID),
});

export const CreateStockAdjustmentBody = t.Object({
  companyId: UUID,
  productId: UUID,
  locationId: UUID,
  reason: SmallInt,
  quantityChange: t.String(), // bigint as string (can be negative)
  notes: t.Optional(t.String()),
  createdBy: UUID,
});

// Stock Transfer schemas
export const ListStockTransfersQuery = t.Object({
  ...PaginationRequestQueryProps,
  companyId: t.Optional(UUID),
  productId: t.Optional(UUID),
  status: t.Optional(SmallInt),
});

export const CreateStockTransferBody = t.Object({
  companyId: UUID,
  productId: UUID,
  fromLocationId: UUID,
  toLocationId: UUID,
  quantity: t.String(), // bigint as string
  notes: t.Optional(t.String()),
  createdBy: UUID,
});

export const UpdateStockTransferBody = t.Object({
  status: SmallInt,
  completedBy: t.Optional(UUID),
});

// Report schemas
export const LowStockReportQuery = t.Object({
  companyId: UUID,
  locationId: t.Optional(UUID),
});

export const MovementHistoryQuery = t.Object({
  ...PaginationRequestQueryProps,
  companyId: UUID,
  productId: t.Optional(UUID),
  locationId: t.Optional(UUID),
  startDate: t.Optional(t.String({ format: 'date-time' })),
  endDate: t.Optional(t.String({ format: 'date-time' })),
});
