import { t } from 'elysia';
import { UUID, NonEmptyString255, PaginationQuery, SmallInt } from '../../schemas/common';

// Product Category schemas
export const ListProductCategoriesQuery = t.Intersect([
  PaginationQuery,
  t.Object({
    companyId: t.Optional(UUID),
  }),
]);

export const GetProductCategoryParams = t.Object({
  id: UUID,
});

export const CreateProductCategoryBody = t.Object({
  companyId: UUID,
  name: NonEmptyString255,
  description: t.Optional(t.String({ maxLength: 500 })),
});

export const UpdateProductCategoryBody = t.Object({
  name: t.Optional(NonEmptyString255),
  description: t.Optional(t.String({ maxLength: 500 })),
});

export const ProductCategoryDto = t.Object({
  id: UUID,
  companyId: UUID,
  name: t.String(),
  description: t.Union([t.String(), t.Null()]),
  isDeleted: t.Boolean(),
  createdBy: UUID,
  createdAt: t.String({ format: 'date-time' }),
  updatedAt: t.String({ format: 'date-time' }),
});

// Product schemas
export const ListProductsQuery = t.Intersect([
  PaginationQuery,
  t.Object({
    companyId: t.Optional(UUID),
    categoryId: t.Optional(UUID),
    search: t.Optional(t.String({ maxLength: 255 })),
  }),
]);

export const GetProductParams = t.Object({
  id: UUID,
});

export const CreateProductBody = t.Object({
  companyId: UUID,
  categoryId: t.Optional(UUID),
  sku: t.String({ minLength: 1, maxLength: 100 }),
  name: NonEmptyString255,
  description: t.Optional(t.String({ maxLength: 1000 })),
  unitOfMeasure: SmallInt,
  minStockLevel: t.Optional(t.String()),
});

export const UpdateProductBody = t.Object({
  categoryId: t.Optional(UUID),
  sku: t.Optional(t.String({ minLength: 1, maxLength: 100 })),
  name: t.Optional(NonEmptyString255),
  description: t.Optional(t.String({ maxLength: 1000 })),
  unitOfMeasure: t.Optional(SmallInt),
  minStockLevel: t.Optional(t.String()),
});

export const ProductDto = t.Object({
  id: UUID,
  companyId: UUID,
  categoryId: t.Union([UUID, t.Null()]),
  categoryName: t.Union([t.String(), t.Null()]),
  sku: t.String(),
  name: t.String(),
  description: t.Union([t.String(), t.Null()]),
  unitOfMeasure: SmallInt,
  minStockLevel: t.String(),
  isDeleted: t.Boolean(),
  createdBy: UUID,
  createdAt: t.String({ format: 'date-time' }),
  updatedAt: t.String({ format: 'date-time' }),
});

// Inventory Location schemas
export const ListInventoryLocationsQuery = t.Intersect([
  PaginationQuery,
  t.Object({
    branchId: t.Optional(UUID),
    isActive: t.Optional(t.Boolean()),
  }),
]);

export const GetInventoryLocationParams = t.Object({
  id: UUID,
});

export const CreateInventoryLocationBody = t.Object({
  branchId: UUID,
  name: NonEmptyString255,
  description: t.Optional(t.String({ maxLength: 500 })),
  isActive: t.Optional(t.Boolean()),
});

export const UpdateInventoryLocationBody = t.Object({
  name: t.Optional(NonEmptyString255),
  description: t.Optional(t.String({ maxLength: 500 })),
  isActive: t.Optional(t.Boolean()),
});

export const InventoryLocationDto = t.Object({
  id: UUID,
  branchId: UUID,
  branchName: t.Union([t.String(), t.Null()]),
  name: t.String(),
  description: t.Union([t.String(), t.Null()]),
  isActive: t.Boolean(),
  createdBy: UUID,
  createdAt: t.String({ format: 'date-time' }),
  updatedAt: t.String({ format: 'date-time' }),
});

// Stock Level schemas
export const ListStockLevelsQuery = t.Intersect([
  PaginationQuery,
  t.Object({
    productId: t.Optional(UUID),
    locationId: t.Optional(UUID),
  }),
]);

export const StockLevelDto = t.Object({
  id: UUID,
  productId: UUID,
  productSku: t.String(),
  productName: t.String(),
  locationId: UUID,
  locationName: t.String(),
  quantityAvailable: t.String(),
  quantityReserved: t.String(),
  lastCountDate: t.Union([t.String({ format: 'date-time' }), t.Null()]),
  updatedAt: t.String({ format: 'date-time' }),
});

// Stock Movement schemas
export const CreateStockMovementBody = t.Object({
  productId: UUID,
  locationId: UUID,
  movementType: SmallInt,
  quantity: t.String(),
  referenceType: t.Optional(t.String({ maxLength: 50 })),
  referenceId: t.Optional(UUID),
  notes: t.Optional(t.String({ maxLength: 1000 })),
});

export const StockMovementDto = t.Object({
  id: UUID,
  productId: UUID,
  productSku: t.String(),
  productName: t.String(),
  locationId: UUID,
  locationName: t.String(),
  movementType: SmallInt,
  quantity: t.String(),
  referenceType: t.Union([t.String(), t.Null()]),
  referenceId: t.Union([UUID, t.Null()]),
  notes: t.Union([t.String(), t.Null()]),
  createdBy: UUID,
  createdAt: t.String({ format: 'date-time' }),
});

export const ListMovementsQuery = t.Intersect([
  PaginationQuery,
  t.Object({
    productId: t.Optional(UUID),
    locationId: t.Optional(UUID),
    movementType: t.Optional(SmallInt),
    startDate: t.Optional(t.String({ format: 'date-time' })),
    endDate: t.Optional(t.String({ format: 'date-time' })),
  }),
]);

// Stock Adjustment schemas
export const CreateStockAdjustmentBody = t.Object({
  productId: UUID,
  locationId: UUID,
  quantity: t.String(),
  reason: SmallInt,
  reasonDetails: t.Optional(t.String({ maxLength: 1000 })),
  notes: t.Optional(t.String({ maxLength: 1000 })),
});

export const ApproveStockAdjustmentBody = t.Object({
  approved: t.Boolean(),
});

export const StockAdjustmentDto = t.Object({
  id: UUID,
  movementId: UUID,
  productId: UUID,
  productSku: t.String(),
  productName: t.String(),
  locationId: UUID,
  locationName: t.String(),
  quantity: t.String(),
  reason: SmallInt,
  reasonDetails: t.Union([t.String(), t.Null()]),
  approvedBy: t.Union([UUID, t.Null()]),
  approvedAt: t.Union([t.String({ format: 'date-time' }), t.Null()]),
  createdBy: UUID,
  createdAt: t.String({ format: 'date-time' }),
});

// Stock Transfer schemas
export const CreateTransferItemBody = t.Object({
  productId: UUID,
  quantityRequested: t.String(),
  notes: t.Optional(t.String({ maxLength: 500 })),
});

export const CreateTransferBody = t.Object({
  fromLocationId: UUID,
  toLocationId: UUID,
  items: t.Array(CreateTransferItemBody),
  notes: t.Optional(t.String({ maxLength: 1000 })),
});

export const UpdateTransferStatusBody = t.Object({
  status: SmallInt,
  notes: t.Optional(t.String({ maxLength: 1000 })),
  cancellationReason: t.Optional(t.String({ maxLength: 500 })),
});

export const UpdateTransferItemBody = t.Object({
  quantityShipped: t.Optional(t.String()),
  quantityReceived: t.Optional(t.String()),
});

export const TransferItemDto = t.Object({
  id: UUID,
  transferId: UUID,
  productId: UUID,
  productSku: t.String(),
  productName: t.String(),
  quantityRequested: t.String(),
  quantityShipped: t.Union([t.String(), t.Null()]),
  quantityReceived: t.Union([t.String(), t.Null()]),
  notes: t.Union([t.String(), t.Null()]),
  createdAt: t.String({ format: 'date-time' }),
});

export const StockTransferDto = t.Object({
  id: UUID,
  transferNumber: t.String(),
  fromLocationId: UUID,
  fromLocationName: t.String(),
  toLocationId: UUID,
  toLocationName: t.String(),
  status: SmallInt,
  requestedBy: UUID,
  approvedBy: t.Union([UUID, t.Null()]),
  approvedAt: t.Union([t.String({ format: 'date-time' }), t.Null()]),
  shippedAt: t.Union([t.String({ format: 'date-time' }), t.Null()]),
  receivedAt: t.Union([t.String({ format: 'date-time' }), t.Null()]),
  cancelledAt: t.Union([t.String({ format: 'date-time' }), t.Null()]),
  cancellationReason: t.Union([t.String(), t.Null()]),
  notes: t.Union([t.String(), t.Null()]),
  items: t.Array(TransferItemDto),
  createdAt: t.String({ format: 'date-time' }),
  updatedAt: t.String({ format: 'date-time' }),
});

export const ListTransfersQuery = t.Intersect([
  PaginationQuery,
  t.Object({
    fromLocationId: t.Optional(UUID),
    toLocationId: t.Optional(UUID),
    status: t.Optional(SmallInt),
  }),
]);

export const GetTransferParams = t.Object({
  id: UUID,
});

// Report schemas
export const LowStockReportDto = t.Object({
  productId: UUID,
  productSku: t.String(),
  productName: t.String(),
  locationId: UUID,
  locationName: t.String(),
  quantityAvailable: t.String(),
  minStockLevel: t.String(),
  deficit: t.String(),
});

export const ListLowStockQuery = t.Object({
  companyId: t.Optional(UUID),
  branchId: t.Optional(UUID),
});

// Response schemas
export const ListProductCategoriesResponse = t.Object({
  data: t.Array(ProductCategoryDto),
  nextCursor: t.Union([t.String(), t.Null()]),
});

export const ListProductsResponse = t.Object({
  data: t.Array(ProductDto),
  nextCursor: t.Union([t.String(), t.Null()]),
});

export const ListInventoryLocationsResponse = t.Object({
  data: t.Array(InventoryLocationDto),
  nextCursor: t.Union([t.String(), t.Null()]),
});

export const ListStockLevelsResponse = t.Object({
  data: t.Array(StockLevelDto),
  nextCursor: t.Union([t.String(), t.Null()]),
});

export const ListStockMovementsResponse = t.Object({
  data: t.Array(StockMovementDto),
  nextCursor: t.Union([t.String(), t.Null()]),
});

export const ListStockTransfersResponse = t.Object({
  data: t.Array(StockTransferDto),
  nextCursor: t.Union([t.String(), t.Null()]),
});

export const ListLowStockResponse = t.Object({
  data: t.Array(LowStockReportDto),
});

export const CreateResponse = t.Object({
  id: UUID,
});
