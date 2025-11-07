import { db } from '@/db/client';
import {
  productCategories,
  products,
  inventoryLocations,
  stockLevels,
  stockMovements,
  stockAdjustments,
  stockTransfers,
  stockTransferItems,
  branches,
} from '@/db/schemas';
import { eq, and, desc, asc, gte, lte, sql, or, ilike } from 'drizzle-orm';
import { BadRequest, Conflict, NotFound } from '../../utils/http-error';
import {
  StockMovementType,
  StockAdjustmentReason,
  TransferStatus,
} from '@/db/schemas/enums';

// Helper function to convert Date to ISO string
function toISOString(date: Date | string | null): string | null {
  if (!date) return null;
  if (typeof date === 'string') return date;
  return date.toISOString();
}

// Helper function to convert bigint to string
function bigintToString(value: bigint | null | undefined): string {
  if (value === null || value === undefined) return '0';
  return value.toString();
}

// =======================
// Product Categories
// =======================

export async function listProductCategories(params: {
  limit: number;
  after?: { createdAt: string; id: string } | null;
  companyId?: string | null;
}) {
  const { limit, after, companyId } = params;

  const conditions = [eq(productCategories.isDeleted, false)];

  if (companyId) {
    conditions.push(eq(productCategories.companyId, companyId));
  }

  if (after) {
    conditions.push(
      or(
        sql`${productCategories.createdAt} < ${after.createdAt}`,
        and(
          sql`${productCategories.createdAt} = ${after.createdAt}`,
          sql`${productCategories.id} < ${after.id}`,
        ),
      )!,
    );
  }

  const data = await db
    .select()
    .from(productCategories)
    .where(and(...conditions))
    .orderBy(desc(productCategories.createdAt), desc(productCategories.id))
    .limit(limit + 1);

  const hasMore = data.length > limit;
  const results = hasMore ? data.slice(0, limit) : data;

  const nextCursor = hasMore
    ? {
        createdAt: toISOString(results[results.length - 1].createdAt)!,
        id: results[results.length - 1].id,
      }
    : null;

  return { data: results, nextCursor };
}

export async function getProductCategory(id: string) {
  const [category] = await db
    .select()
    .from(productCategories)
    .where(and(eq(productCategories.id, id), eq(productCategories.isDeleted, false)));

  if (!category) {
    throw NotFound('Product category not found');
  }

  return category;
}

export async function createProductCategory(input: {
  companyId: string;
  name: string;
  description?: string;
  createdBy: string;
}) {
  const [created] = await db
    .insert(productCategories)
    .values({
      companyId: input.companyId,
      name: input.name,
      description: input.description,
      createdBy: input.createdBy,
      isDeleted: false,
    })
    .returning({ id: productCategories.id });

  return created;
}

export async function updateProductCategory(
  id: string,
  patch: {
    name?: string;
    description?: string;
  },
) {
  const [updated] = await db
    .update(productCategories)
    .set({
      ...patch,
      updatedAt: sql`NOW()`,
    })
    .where(and(eq(productCategories.id, id), eq(productCategories.isDeleted, false)))
    .returning({ id: productCategories.id });

  if (!updated) {
    throw NotFound('Product category not found');
  }

  return updated;
}

export async function deleteProductCategory(id: string) {
  const [deleted] = await db
    .update(productCategories)
    .set({ isDeleted: true, updatedAt: sql`NOW()` })
    .where(and(eq(productCategories.id, id), eq(productCategories.isDeleted, false)))
    .returning({ id: productCategories.id });

  if (!deleted) {
    throw NotFound('Product category not found');
  }

  return { success: true };
}

// =======================
// Products
// =======================

export async function listProducts(params: {
  limit: number;
  after?: { createdAt: string; id: string } | null;
  companyId?: string | null;
  categoryId?: string | null;
  search?: string | null;
}) {
  const { limit, after, companyId, categoryId, search } = params;

  const conditions = [eq(products.isDeleted, false)];

  if (companyId) {
    conditions.push(eq(products.companyId, companyId));
  }

  if (categoryId) {
    conditions.push(eq(products.categoryId, categoryId));
  }

  if (search) {
    conditions.push(
      or(ilike(products.name, `%${search}%`), ilike(products.sku, `%${search}%`))!,
    );
  }

  if (after) {
    conditions.push(
      or(
        sql`${products.createdAt} < ${after.createdAt}`,
        and(
          sql`${products.createdAt} = ${after.createdAt}`,
          sql`${products.id} < ${after.id}`,
        ),
      )!,
    );
  }

  const data = await db
    .select({
      id: products.id,
      companyId: products.companyId,
      categoryId: products.categoryId,
      categoryName: productCategories.name,
      sku: products.sku,
      name: products.name,
      description: products.description,
      unitOfMeasure: products.unitOfMeasure,
      minStockLevel: products.minStockLevel,
      isDeleted: products.isDeleted,
      createdBy: products.createdBy,
      createdAt: products.createdAt,
      updatedAt: products.updatedAt,
    })
    .from(products)
    .leftJoin(productCategories, eq(products.categoryId, productCategories.id))
    .where(and(...conditions))
    .orderBy(desc(products.createdAt), desc(products.id))
    .limit(limit + 1);

  const hasMore = data.length > limit;
  const results = hasMore ? data.slice(0, limit) : data;

  const nextCursor = hasMore
    ? {
        createdAt: toISOString(results[results.length - 1].createdAt)!,
        id: results[results.length - 1].id,
      }
    : null;

  return { data: results, nextCursor };
}

export async function getProduct(id: string) {
  const [product] = await db
    .select({
      id: products.id,
      companyId: products.companyId,
      categoryId: products.categoryId,
      categoryName: productCategories.name,
      sku: products.sku,
      name: products.name,
      description: products.description,
      unitOfMeasure: products.unitOfMeasure,
      minStockLevel: products.minStockLevel,
      isDeleted: products.isDeleted,
      createdBy: products.createdBy,
      createdAt: products.createdAt,
      updatedAt: products.updatedAt,
    })
    .from(products)
    .leftJoin(productCategories, eq(products.categoryId, productCategories.id))
    .where(and(eq(products.id, id), eq(products.isDeleted, false)));

  if (!product) {
    throw NotFound('Product not found');
  }

  return product;
}

export async function createProduct(input: {
  companyId: string;
  categoryId?: string;
  sku: string;
  name: string;
  description?: string;
  unitOfMeasure: number;
  minStockLevel?: string;
  createdBy: string;
}) {
  // Check for duplicate SKU
  const [existing] = await db
    .select()
    .from(products)
    .where(
      and(
        eq(products.companyId, input.companyId),
        eq(products.sku, input.sku),
        eq(products.isDeleted, false),
      ),
    );

  if (existing) {
    throw Conflict('Product with this SKU already exists for this company');
  }

  const minStockLevel = input.minStockLevel ? BigInt(input.minStockLevel) : BigInt(0);

  const [created] = await db
    .insert(products)
    .values({
      companyId: input.companyId,
      categoryId: input.categoryId,
      sku: input.sku,
      name: input.name,
      description: input.description,
      unitOfMeasure: input.unitOfMeasure,
      minStockLevel,
      createdBy: input.createdBy,
      isDeleted: false,
    })
    .returning({ id: products.id });

  return created;
}

export async function updateProduct(
  id: string,
  patch: {
    categoryId?: string;
    sku?: string;
    name?: string;
    description?: string;
    unitOfMeasure?: number;
    minStockLevel?: string;
  },
) {
  const [existing] = await db
    .select()
    .from(products)
    .where(and(eq(products.id, id), eq(products.isDeleted, false)));

  if (!existing) {
    throw NotFound('Product not found');
  }

  // Check for duplicate SKU if being updated
  if (patch.sku && patch.sku !== existing.sku) {
    const [duplicate] = await db
      .select()
      .from(products)
      .where(
        and(
          eq(products.companyId, existing.companyId),
          eq(products.sku, patch.sku),
          eq(products.isDeleted, false),
        ),
      );

    if (duplicate && duplicate.id !== id) {
      throw Conflict('Product with this SKU already exists for this company');
    }
  }

  const updateData: Record<string, unknown> = {
    ...patch,
    updatedAt: sql`NOW()`,
  };

  if (patch.minStockLevel !== undefined) {
    updateData.minStockLevel = BigInt(patch.minStockLevel);
  }

  const [updated] = await db
    .update(products)
    .set(updateData)
    .where(and(eq(products.id, id), eq(products.isDeleted, false)))
    .returning({ id: products.id });

  if (!updated) {
    throw NotFound('Product not found');
  }

  return updated;
}

export async function deleteProduct(id: string) {
  const [deleted] = await db
    .update(products)
    .set({ isDeleted: true, updatedAt: sql`NOW()` })
    .where(and(eq(products.id, id), eq(products.isDeleted, false)))
    .returning({ id: products.id });

  if (!deleted) {
    throw NotFound('Product not found');
  }

  return { success: true };
}

// =======================
// Inventory Locations
// =======================

export async function listInventoryLocations(params: {
  limit: number;
  after?: { createdAt: string; id: string } | null;
  branchId?: string | null;
  isActive?: boolean | null;
}) {
  const { limit, after, branchId, isActive } = params;

  const conditions = [];

  if (branchId) {
    conditions.push(eq(inventoryLocations.branchId, branchId));
  }

  if (isActive !== null && isActive !== undefined) {
    conditions.push(eq(inventoryLocations.isActive, isActive));
  }

  if (after) {
    conditions.push(
      or(
        sql`${inventoryLocations.createdAt} < ${after.createdAt}`,
        and(
          sql`${inventoryLocations.createdAt} = ${after.createdAt}`,
          sql`${inventoryLocations.id} < ${after.id}`,
        ),
      )!,
    );
  }

  const data = await db
    .select({
      id: inventoryLocations.id,
      branchId: inventoryLocations.branchId,
      branchName: branches.name,
      name: inventoryLocations.name,
      description: inventoryLocations.description,
      isActive: inventoryLocations.isActive,
      createdBy: inventoryLocations.createdBy,
      createdAt: inventoryLocations.createdAt,
      updatedAt: inventoryLocations.updatedAt,
    })
    .from(inventoryLocations)
    .leftJoin(branches, eq(inventoryLocations.branchId, branches.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(inventoryLocations.createdAt), desc(inventoryLocations.id))
    .limit(limit + 1);

  const hasMore = data.length > limit;
  const results = hasMore ? data.slice(0, limit) : data;

  const nextCursor = hasMore
    ? {
        createdAt: toISOString(results[results.length - 1].createdAt)!,
        id: results[results.length - 1].id,
      }
    : null;

  return { data: results, nextCursor };
}

export async function getInventoryLocation(id: string) {
  const [location] = await db
    .select({
      id: inventoryLocations.id,
      branchId: inventoryLocations.branchId,
      branchName: branches.name,
      name: inventoryLocations.name,
      description: inventoryLocations.description,
      isActive: inventoryLocations.isActive,
      createdBy: inventoryLocations.createdBy,
      createdAt: inventoryLocations.createdAt,
      updatedAt: inventoryLocations.updatedAt,
    })
    .from(inventoryLocations)
    .leftJoin(branches, eq(inventoryLocations.branchId, branches.id))
    .where(eq(inventoryLocations.id, id));

  if (!location) {
    throw NotFound('Inventory location not found');
  }

  return location;
}

export async function createInventoryLocation(input: {
  branchId: string;
  name: string;
  description?: string;
  isActive?: boolean;
  createdBy: string;
}) {
  // Check for duplicate name in branch
  const [existing] = await db
    .select()
    .from(inventoryLocations)
    .where(
      and(eq(inventoryLocations.branchId, input.branchId), eq(inventoryLocations.name, input.name)),
    );

  if (existing) {
    throw Conflict('Location with this name already exists in this branch');
  }

  const [created] = await db
    .insert(inventoryLocations)
    .values({
      branchId: input.branchId,
      name: input.name,
      description: input.description,
      isActive: input.isActive ?? true,
      createdBy: input.createdBy,
    })
    .returning({ id: inventoryLocations.id });

  return created;
}

export async function updateInventoryLocation(
  id: string,
  patch: {
    name?: string;
    description?: string;
    isActive?: boolean;
  },
) {
  const [existing] = await db
    .select()
    .from(inventoryLocations)
    .where(eq(inventoryLocations.id, id));

  if (!existing) {
    throw NotFound('Inventory location not found');
  }

  // Check for duplicate name if being updated
  if (patch.name && patch.name !== existing.name) {
    const [duplicate] = await db
      .select()
      .from(inventoryLocations)
      .where(
        and(eq(inventoryLocations.branchId, existing.branchId), eq(inventoryLocations.name, patch.name)),
      );

    if (duplicate && duplicate.id !== id) {
      throw Conflict('Location with this name already exists in this branch');
    }
  }

  const [updated] = await db
    .update(inventoryLocations)
    .set({
      ...patch,
      updatedAt: sql`NOW()`,
    })
    .where(eq(inventoryLocations.id, id))
    .returning({ id: inventoryLocations.id });

  if (!updated) {
    throw NotFound('Inventory location not found');
  }

  return updated;
}

// =======================
// Stock Levels
// =======================

export async function listStockLevels(params: {
  limit: number;
  after?: { updatedAt: string; id: string } | null;
  productId?: string | null;
  locationId?: string | null;
}) {
  const { limit, after, productId, locationId } = params;

  const conditions = [];

  if (productId) {
    conditions.push(eq(stockLevels.productId, productId));
  }

  if (locationId) {
    conditions.push(eq(stockLevels.locationId, locationId));
  }

  if (after) {
    conditions.push(
      or(
        sql`${stockLevels.updatedAt} < ${after.updatedAt}`,
        and(
          sql`${stockLevels.updatedAt} = ${after.updatedAt}`,
          sql`${stockLevels.id} < ${after.id}`,
        ),
      )!,
    );
  }

  const data = await db
    .select({
      id: stockLevels.id,
      productId: stockLevels.productId,
      productSku: products.sku,
      productName: products.name,
      locationId: stockLevels.locationId,
      locationName: inventoryLocations.name,
      quantityAvailable: stockLevels.quantityAvailable,
      quantityReserved: stockLevels.quantityReserved,
      lastCountDate: stockLevels.lastCountDate,
      updatedAt: stockLevels.updatedAt,
    })
    .from(stockLevels)
    .innerJoin(products, eq(stockLevels.productId, products.id))
    .innerJoin(inventoryLocations, eq(stockLevels.locationId, inventoryLocations.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(stockLevels.updatedAt), desc(stockLevels.id))
    .limit(limit + 1);

  const hasMore = data.length > limit;
  const results = hasMore ? data.slice(0, limit) : data;

  const nextCursor = hasMore
    ? {
        updatedAt: toISOString(results[results.length - 1].updatedAt)!,
        id: results[results.length - 1].id,
      }
    : null;

  return { data: results, nextCursor };
}

export async function getProductStock(productId: string) {
  const data = await db
    .select({
      id: stockLevels.id,
      productId: stockLevels.productId,
      productSku: products.sku,
      productName: products.name,
      locationId: stockLevels.locationId,
      locationName: inventoryLocations.name,
      quantityAvailable: stockLevels.quantityAvailable,
      quantityReserved: stockLevels.quantityReserved,
      lastCountDate: stockLevels.lastCountDate,
      updatedAt: stockLevels.updatedAt,
    })
    .from(stockLevels)
    .innerJoin(products, eq(stockLevels.productId, products.id))
    .innerJoin(inventoryLocations, eq(stockLevels.locationId, inventoryLocations.id))
    .where(eq(stockLevels.productId, productId))
    .orderBy(asc(inventoryLocations.name));

  return data;
}

// =======================
// Stock Movements
// =======================

export async function recordStockMovement(input: {
  productId: string;
  locationId: string;
  movementType: number;
  quantity: string;
  referenceType?: string;
  referenceId?: string;
  notes?: string;
  createdBy: string;
}) {
  return await db.transaction(async (tx) => {
    const quantityBigInt = BigInt(input.quantity);

    // Validate movement type
    if (
      input.movementType !== StockMovementType.RECEIPT &&
      input.movementType !== StockMovementType.ISSUE &&
      input.movementType !== StockMovementType.ADJUSTMENT &&
      input.movementType !== StockMovementType.TRANSFER_OUT &&
      input.movementType !== StockMovementType.TRANSFER_IN
    ) {
      throw BadRequest('Invalid movement type');
    }

    // Record the movement
    const [movement] = await tx
      .insert(stockMovements)
      .values({
        productId: input.productId,
        locationId: input.locationId,
        movementType: input.movementType,
        quantity: quantityBigInt,
        referenceType: input.referenceType,
        referenceId: input.referenceId,
        notes: input.notes,
        createdBy: input.createdBy,
      })
      .returning();

    // Update stock level
    const [existingLevel] = await tx
      .select()
      .from(stockLevels)
      .where(
        and(eq(stockLevels.productId, input.productId), eq(stockLevels.locationId, input.locationId)),
      );

    if (existingLevel) {
      // Update existing stock level
      let newQuantity = existingLevel.quantityAvailable;

      if (
        input.movementType === StockMovementType.RECEIPT ||
        input.movementType === StockMovementType.TRANSFER_IN
      ) {
        newQuantity = newQuantity + quantityBigInt;
      } else if (
        input.movementType === StockMovementType.ISSUE ||
        input.movementType === StockMovementType.TRANSFER_OUT
      ) {
        newQuantity = newQuantity - quantityBigInt;
        if (newQuantity < BigInt(0)) {
          throw BadRequest('Insufficient stock for this operation');
        }
      } else if (input.movementType === StockMovementType.ADJUSTMENT) {
        newQuantity = quantityBigInt;
      }

      await tx
        .update(stockLevels)
        .set({
          quantityAvailable: newQuantity,
          updatedAt: sql`NOW()`,
        })
        .where(eq(stockLevels.id, existingLevel.id));
    } else {
      // Create new stock level
      if (
        input.movementType === StockMovementType.RECEIPT ||
        input.movementType === StockMovementType.TRANSFER_IN ||
        input.movementType === StockMovementType.ADJUSTMENT
      ) {
        await tx.insert(stockLevels).values({
          productId: input.productId,
          locationId: input.locationId,
          quantityAvailable: quantityBigInt,
          quantityReserved: BigInt(0),
        });
      } else {
        throw BadRequest('Cannot issue from non-existent stock');
      }
    }

    return movement;
  });
}

export async function listStockMovements(params: {
  limit: number;
  after?: { createdAt: string; id: string } | null;
  productId?: string | null;
  locationId?: string | null;
  movementType?: number | null;
  startDate?: string | null;
  endDate?: string | null;
}) {
  const { limit, after, productId, locationId, movementType, startDate, endDate } = params;

  const conditions = [];

  if (productId) {
    conditions.push(eq(stockMovements.productId, productId));
  }

  if (locationId) {
    conditions.push(eq(stockMovements.locationId, locationId));
  }

  if (movementType !== null && movementType !== undefined) {
    conditions.push(eq(stockMovements.movementType, movementType));
  }

  if (startDate) {
    conditions.push(gte(stockMovements.createdAt, new Date(startDate)));
  }

  if (endDate) {
    conditions.push(lte(stockMovements.createdAt, new Date(endDate)));
  }

  if (after) {
    conditions.push(
      or(
        sql`${stockMovements.createdAt} < ${after.createdAt}`,
        and(
          sql`${stockMovements.createdAt} = ${after.createdAt}`,
          sql`${stockMovements.id} < ${after.id}`,
        ),
      )!,
    );
  }

  const data = await db
    .select({
      id: stockMovements.id,
      productId: stockMovements.productId,
      productSku: products.sku,
      productName: products.name,
      locationId: stockMovements.locationId,
      locationName: inventoryLocations.name,
      movementType: stockMovements.movementType,
      quantity: stockMovements.quantity,
      referenceType: stockMovements.referenceType,
      referenceId: stockMovements.referenceId,
      notes: stockMovements.notes,
      createdBy: stockMovements.createdBy,
      createdAt: stockMovements.createdAt,
    })
    .from(stockMovements)
    .innerJoin(products, eq(stockMovements.productId, products.id))
    .innerJoin(inventoryLocations, eq(stockMovements.locationId, inventoryLocations.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(stockMovements.createdAt), desc(stockMovements.id))
    .limit(limit + 1);

  const hasMore = data.length > limit;
  const results = hasMore ? data.slice(0, limit) : data;

  const nextCursor = hasMore
    ? {
        createdAt: toISOString(results[results.length - 1].createdAt)!,
        id: results[results.length - 1].id,
      }
    : null;

  return { data: results, nextCursor };
}

// =======================
// Stock Adjustments
// =======================

export async function createStockAdjustment(input: {
  productId: string;
  locationId: string;
  quantity: string;
  reason: number;
  reasonDetails?: string;
  notes?: string;
  createdBy: string;
}) {
  return await db.transaction(async (tx) => {
    // Validate reason
    if (
      input.reason !== StockAdjustmentReason.DAMAGE &&
      input.reason !== StockAdjustmentReason.LOSS &&
      input.reason !== StockAdjustmentReason.FOUND &&
      input.reason !== StockAdjustmentReason.RECOUNT &&
      input.reason !== StockAdjustmentReason.EXPIRED &&
      input.reason !== StockAdjustmentReason.OTHER
    ) {
      throw BadRequest('Invalid adjustment reason');
    }

    // Create stock movement
    const [movement] = await tx
      .insert(stockMovements)
      .values({
        productId: input.productId,
        locationId: input.locationId,
        movementType: StockMovementType.ADJUSTMENT,
        quantity: BigInt(input.quantity),
        referenceType: 'STOCK_ADJUSTMENT',
        notes: input.notes,
        createdBy: input.createdBy,
      })
      .returning();

    // Create stock adjustment record
    const [adjustment] = await tx
      .insert(stockAdjustments)
      .values({
        movementId: movement.id,
        reason: input.reason,
        reasonDetails: input.reasonDetails,
        createdBy: input.createdBy,
      })
      .returning();

    // Update stock level
    const [existingLevel] = await tx
      .select()
      .from(stockLevels)
      .where(
        and(eq(stockLevels.productId, input.productId), eq(stockLevels.locationId, input.locationId)),
      );

    const newQuantity = BigInt(input.quantity);

    if (existingLevel) {
      await tx
        .update(stockLevels)
        .set({
          quantityAvailable: newQuantity,
          lastCountDate: sql`NOW()`,
          updatedAt: sql`NOW()`,
        })
        .where(eq(stockLevels.id, existingLevel.id));
    } else {
      await tx.insert(stockLevels).values({
        productId: input.productId,
        locationId: input.locationId,
        quantityAvailable: newQuantity,
        quantityReserved: BigInt(0),
        lastCountDate: sql`NOW()`,
      });
    }

    return adjustment;
  });
}

export async function approveStockAdjustment(
  adjustmentId: string,
  approvedBy: string,
) {
  const [updated] = await db
    .update(stockAdjustments)
    .set({
      approvedBy,
      approvedAt: sql`NOW()`,
    })
    .where(eq(stockAdjustments.id, adjustmentId))
    .returning();

  if (!updated) {
    throw NotFound('Stock adjustment not found');
  }

  return updated;
}

// =======================
// Stock Transfers
// =======================

export async function createStockTransfer(input: {
  fromLocationId: string;
  toLocationId: string;
  items: Array<{
    productId: string;
    quantityRequested: string;
    notes?: string;
  }>;
  notes?: string;
  requestedBy: string;
}) {
  if (input.fromLocationId === input.toLocationId) {
    throw BadRequest('Cannot transfer to the same location');
  }

  if (!input.items || input.items.length === 0) {
    throw BadRequest('Transfer must have at least one item');
  }

  return await db.transaction(async (tx) => {
    // Generate transfer number
    const transferNumber = `TRF-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Create transfer
    const [transfer] = await tx
      .insert(stockTransfers)
      .values({
        transferNumber,
        fromLocationId: input.fromLocationId,
        toLocationId: input.toLocationId,
        status: TransferStatus.PENDING,
        requestedBy: input.requestedBy,
        notes: input.notes,
      })
      .returning();

    // Create transfer items
    for (const item of input.items) {
      await tx.insert(stockTransferItems).values({
        transferId: transfer.id,
        productId: item.productId,
        quantityRequested: BigInt(item.quantityRequested),
        notes: item.notes,
      });
    }

    return transfer;
  });
}

export async function updateTransferStatus(
  transferId: string,
  status: number,
  notes?: string,
  cancellationReason?: string,
  userId?: string,
) {
  return await db.transaction(async (tx) => {
    const [existing] = await tx
      .select()
      .from(stockTransfers)
      .where(eq(stockTransfers.id, transferId));

    if (!existing) {
      throw NotFound('Stock transfer not found');
    }

    // Validate status transition
    if (
      status !== TransferStatus.PENDING &&
      status !== TransferStatus.IN_TRANSIT &&
      status !== TransferStatus.COMPLETED &&
      status !== TransferStatus.CANCELLED
    ) {
      throw BadRequest('Invalid transfer status');
    }

    const updateData: Record<string, unknown> = {
      status,
      updatedAt: sql`NOW()`,
    };

    if (notes) {
      updateData.notes = notes;
    }

    if (status === TransferStatus.IN_TRANSIT) {
      updateData.shippedAt = sql`NOW()`;
    } else if (status === TransferStatus.COMPLETED) {
      updateData.receivedAt = sql`NOW()`;
    } else if (status === TransferStatus.CANCELLED) {
      updateData.cancelledAt = sql`NOW()`;
      updateData.cancellationReason = cancellationReason;
    }

    const [updated] = await tx
      .update(stockTransfers)
      .set(updateData)
      .where(eq(stockTransfers.id, transferId))
      .returning();

    return updated;
  });
}

export async function completeStockTransfer(
  transferId: string,
  userId: string,
) {
  return await db.transaction(async (tx) => {
    const [transfer] = await tx
      .select()
      .from(stockTransfers)
      .where(eq(stockTransfers.id, transferId));

    if (!transfer) {
      throw NotFound('Stock transfer not found');
    }

    if (transfer.status !== TransferStatus.IN_TRANSIT) {
      throw BadRequest('Transfer must be in transit to complete');
    }

    // Get transfer items
    const items = await tx
      .select()
      .from(stockTransferItems)
      .where(eq(stockTransferItems.transferId, transferId));

    // Create movements for each item
    for (const item of items) {
      const quantity = item.quantityShipped || item.quantityRequested;

      // Transfer out from source
      await tx.insert(stockMovements).values({
        productId: item.productId,
        locationId: transfer.fromLocationId,
        movementType: StockMovementType.TRANSFER_OUT,
        quantity: -quantity,
        referenceType: 'TRANSFER',
        referenceId: transferId,
        createdBy: userId,
      });

      // Transfer in to destination
      await tx.insert(stockMovements).values({
        productId: item.productId,
        locationId: transfer.toLocationId,
        movementType: StockMovementType.TRANSFER_IN,
        quantity,
        referenceType: 'TRANSFER',
        referenceId: transferId,
        createdBy: userId,
      });

      // Update source stock level
      const [sourceLevel] = await tx
        .select()
        .from(stockLevels)
        .where(
          and(
            eq(stockLevels.productId, item.productId),
            eq(stockLevels.locationId, transfer.fromLocationId),
          ),
        );

      if (sourceLevel) {
        const newQuantity = sourceLevel.quantityAvailable - quantity;
        if (newQuantity < BigInt(0)) {
          throw BadRequest('Insufficient stock for transfer');
        }

        await tx
          .update(stockLevels)
          .set({
            quantityAvailable: newQuantity,
            updatedAt: sql`NOW()`,
          })
          .where(eq(stockLevels.id, sourceLevel.id));
      } else {
        throw BadRequest('Source stock level not found');
      }

      // Update or create destination stock level
      const [destLevel] = await tx
        .select()
        .from(stockLevels)
        .where(
          and(
            eq(stockLevels.productId, item.productId),
            eq(stockLevels.locationId, transfer.toLocationId),
          ),
        );

      if (destLevel) {
        await tx
          .update(stockLevels)
          .set({
            quantityAvailable: destLevel.quantityAvailable + quantity,
            updatedAt: sql`NOW()`,
          })
          .where(eq(stockLevels.id, destLevel.id));
      } else {
        await tx.insert(stockLevels).values({
          productId: item.productId,
          locationId: transfer.toLocationId,
          quantityAvailable: quantity,
          quantityReserved: BigInt(0),
        });
      }
    }

    // Update transfer status
    const [updated] = await tx
      .update(stockTransfers)
      .set({
        status: TransferStatus.COMPLETED,
        receivedAt: sql`NOW()`,
        updatedAt: sql`NOW()`,
      })
      .where(eq(stockTransfers.id, transferId))
      .returning();

    return updated;
  });
}

export async function listStockTransfers(params: {
  limit: number;
  after?: { createdAt: string; id: string } | null;
  fromLocationId?: string | null;
  toLocationId?: string | null;
  status?: number | null;
}) {
  const { limit, after, fromLocationId, toLocationId, status } = params;

  const conditions = [];

  if (fromLocationId) {
    conditions.push(eq(stockTransfers.fromLocationId, fromLocationId));
  }

  if (toLocationId) {
    conditions.push(eq(stockTransfers.toLocationId, toLocationId));
  }

  if (status !== null && status !== undefined) {
    conditions.push(eq(stockTransfers.status, status));
  }

  if (after) {
    conditions.push(
      or(
        sql`${stockTransfers.createdAt} < ${after.createdAt}`,
        and(
          sql`${stockTransfers.createdAt} = ${after.createdAt}`,
          sql`${stockTransfers.id} < ${after.id}`,
        ),
      )!,
    );
  }

  const data = await db
    .select({
      id: stockTransfers.id,
      transferNumber: stockTransfers.transferNumber,
      fromLocationId: stockTransfers.fromLocationId,
      toLocationId: stockTransfers.toLocationId,
      status: stockTransfers.status,
      requestedBy: stockTransfers.requestedBy,
      approvedBy: stockTransfers.approvedBy,
      approvedAt: stockTransfers.approvedAt,
      shippedAt: stockTransfers.shippedAt,
      receivedAt: stockTransfers.receivedAt,
      cancelledAt: stockTransfers.cancelledAt,
      cancellationReason: stockTransfers.cancellationReason,
      notes: stockTransfers.notes,
      createdAt: stockTransfers.createdAt,
      updatedAt: stockTransfers.updatedAt,
    })
    .from(stockTransfers)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(stockTransfers.createdAt), desc(stockTransfers.id))
    .limit(limit + 1);

  const hasMore = data.length > limit;
  const results = hasMore ? data.slice(0, limit) : data;

  const nextCursor = hasMore
    ? {
        createdAt: toISOString(results[results.length - 1].createdAt)!,
        id: results[results.length - 1].id,
      }
    : null;

  return { data: results, nextCursor };
}

export async function getStockTransfer(transferId: string) {
  const [transfer] = await db
    .select({
      id: stockTransfers.id,
      transferNumber: stockTransfers.transferNumber,
      fromLocationId: stockTransfers.fromLocationId,
      fromLocationName: sql<string>`from_loc.name`,
      toLocationId: stockTransfers.toLocationId,
      toLocationName: sql<string>`to_loc.name`,
      status: stockTransfers.status,
      requestedBy: stockTransfers.requestedBy,
      approvedBy: stockTransfers.approvedBy,
      approvedAt: stockTransfers.approvedAt,
      shippedAt: stockTransfers.shippedAt,
      receivedAt: stockTransfers.receivedAt,
      cancelledAt: stockTransfers.cancelledAt,
      cancellationReason: stockTransfers.cancellationReason,
      notes: stockTransfers.notes,
      createdAt: stockTransfers.createdAt,
      updatedAt: stockTransfers.updatedAt,
    })
    .from(stockTransfers)
    .leftJoin(
      sql`inventory_locations as from_loc`,
      sql`${stockTransfers.fromLocationId} = from_loc.id`,
    )
    .leftJoin(
      sql`inventory_locations as to_loc`,
      sql`${stockTransfers.toLocationId} = to_loc.id`,
    )
    .where(eq(stockTransfers.id, transferId));

  if (!transfer) {
    throw NotFound('Stock transfer not found');
  }

  // Get transfer items
  const items = await db
    .select({
      id: stockTransferItems.id,
      transferId: stockTransferItems.transferId,
      productId: stockTransferItems.productId,
      productSku: products.sku,
      productName: products.name,
      quantityRequested: stockTransferItems.quantityRequested,
      quantityShipped: stockTransferItems.quantityShipped,
      quantityReceived: stockTransferItems.quantityReceived,
      notes: stockTransferItems.notes,
      createdAt: stockTransferItems.createdAt,
    })
    .from(stockTransferItems)
    .innerJoin(products, eq(stockTransferItems.productId, products.id))
    .where(eq(stockTransferItems.transferId, transferId));

  return { ...transfer, items };
}

// =======================
// Reports
// =======================

export async function getLowStockReport(params: {
  companyId?: string | null;
  branchId?: string | null;
}) {
  const { companyId, branchId } = params;

  const conditions = [
    eq(products.isDeleted, false),
    sql`${stockLevels.quantityAvailable} < ${products.minStockLevel}`,
  ];

  if (companyId) {
    conditions.push(eq(products.companyId, companyId));
  }

  if (branchId) {
    conditions.push(eq(inventoryLocations.branchId, branchId));
  }

  const data = await db
    .select({
      productId: products.id,
      productSku: products.sku,
      productName: products.name,
      locationId: inventoryLocations.id,
      locationName: inventoryLocations.name,
      quantityAvailable: stockLevels.quantityAvailable,
      minStockLevel: products.minStockLevel,
      deficit: sql<bigint>`${products.minStockLevel} - ${stockLevels.quantityAvailable}`,
    })
    .from(products)
    .innerJoin(stockLevels, eq(products.id, stockLevels.productId))
    .innerJoin(inventoryLocations, eq(stockLevels.locationId, inventoryLocations.id))
    .where(and(...conditions))
    .orderBy(sql`${products.minStockLevel} - ${stockLevels.quantityAvailable} DESC`);

  return data;
}
