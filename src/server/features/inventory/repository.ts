import { and, asc, eq, gt, or, sql, desc, gte, lte, lt } from 'drizzle-orm';
import { db } from '@/db/config';
import {
  productCategories,
  products,
  inventoryLocations,
  stockLevels,
  stockMovements,
  stockAdjustments,
  stockTransfers,
} from '@/db/schemas';

// Product Categories
export type ListProductCategoriesParams = {
  limit: number;
  after?: { createdAt: string; id: string } | null;
  companyId?: string | null;
};

export async function listProductCategoriesRepo(p: ListProductCategoriesParams) {
  const where = [eq(productCategories.isDeleted, false)];
  if (p.companyId) where.push(eq(productCategories.companyId, p.companyId));
  if (p.after) {
    where.push(
      or(
        gt(productCategories.createdAt, new Date(p.after.createdAt)),
        and(
          eq(productCategories.createdAt, new Date(p.after.createdAt)),
          gt(productCategories.id, p.after.id),
        ),
      ),
    );
  }
  const rows = await db
    .select()
    .from(productCategories)
    .where(and(...where))
    .orderBy(asc(productCategories.createdAt), asc(productCategories.id))
    .limit(p.limit + 1);

  const hasMore = rows.length > p.limit;
  const data = hasMore ? rows.slice(0, p.limit) : rows;
  const nextCursor = hasMore
    ? { createdAt: data[data.length - 1]!.createdAt!.toISOString(), id: data[data.length - 1]!.id }
    : null;
  return { data, nextCursor };
}

export async function getProductCategoryRepo(id: string) {
  const [row] = await db
    .select()
    .from(productCategories)
    .where(and(eq(productCategories.id, id), eq(productCategories.isDeleted, false)))
    .limit(1);
  return row ?? null;
}

export async function findProductCategoryByNameRepo(companyId: string, name: string) {
  const [row] = await db
    .select({ id: productCategories.id })
    .from(productCategories)
    .where(
      and(
        eq(productCategories.companyId, companyId),
        sql`lower(${productCategories.name}) = lower(${name})`,
        eq(productCategories.isDeleted, false),
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function createProductCategoryRepo(values: typeof productCategories.$inferInsert) {
  const [row] = await db.insert(productCategories).values(values).returning({ id: productCategories.id });
  return row;
}

export async function updateProductCategoryRepo(
  id: string,
  patch: Partial<typeof productCategories.$inferInsert>,
) {
  const [row] = await db
    .update(productCategories)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(productCategories.id, id))
    .returning({ id: productCategories.id });
  return row ?? null;
}

export async function softDeleteProductCategoryRepo(id: string) {
  const rows = await db
    .update(productCategories)
    .set({ isDeleted: true })
    .where(eq(productCategories.id, id))
    .returning({ id: productCategories.id });
  return rows.length;
}

// Products
export type ListProductsParams = {
  limit: number;
  after?: { createdAt: string; id: string } | null;
  companyId?: string | null;
  categoryId?: string | null;
};

export async function listProductsRepo(p: ListProductsParams) {
  const where = [eq(products.isDeleted, false)];
  if (p.companyId) where.push(eq(products.companyId, p.companyId));
  if (p.categoryId) where.push(eq(products.categoryId, p.categoryId));
  if (p.after) {
    where.push(
      or(
        gt(products.createdAt, new Date(p.after.createdAt)),
        and(eq(products.createdAt, new Date(p.after.createdAt)), gt(products.id, p.after.id)),
      ),
    );
  }
  const rows = await db
    .select()
    .from(products)
    .where(and(...where))
    .orderBy(asc(products.createdAt), asc(products.id))
    .limit(p.limit + 1);

  const hasMore = rows.length > p.limit;
  const data = hasMore ? rows.slice(0, p.limit) : rows;
  const nextCursor = hasMore
    ? { createdAt: data[data.length - 1]!.createdAt!.toISOString(), id: data[data.length - 1]!.id }
    : null;
  return { data, nextCursor };
}

export async function getProductRepo(id: string) {
  const [row] = await db
    .select()
    .from(products)
    .where(and(eq(products.id, id), eq(products.isDeleted, false)))
    .limit(1);
  return row ?? null;
}

export async function findProductBySkuRepo(companyId: string, sku: string) {
  const [row] = await db
    .select({ id: products.id })
    .from(products)
    .where(
      and(
        eq(products.companyId, companyId),
        sql`lower(${products.sku}) = lower(${sku})`,
        eq(products.isDeleted, false),
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function createProductRepo(values: typeof products.$inferInsert) {
  const [row] = await db.insert(products).values(values).returning({ id: products.id });
  return row;
}

export async function updateProductRepo(id: string, patch: Partial<typeof products.$inferInsert>) {
  const [row] = await db
    .update(products)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(products.id, id))
    .returning({ id: products.id });
  return row ?? null;
}

export async function softDeleteProductRepo(id: string) {
  const rows = await db
    .update(products)
    .set({ isDeleted: true })
    .where(eq(products.id, id))
    .returning({ id: products.id });
  return rows.length;
}

// Inventory Locations
export type ListInventoryLocationsParams = {
  limit: number;
  after?: { createdAt: string; id: string } | null;
  companyId?: string | null;
  branchId?: string | null;
};

export async function listInventoryLocationsRepo(p: ListInventoryLocationsParams) {
  const where = [eq(inventoryLocations.isDeleted, false)];
  if (p.companyId) where.push(eq(inventoryLocations.companyId, p.companyId));
  if (p.branchId) where.push(eq(inventoryLocations.branchId, p.branchId));
  if (p.after) {
    where.push(
      or(
        gt(inventoryLocations.createdAt, new Date(p.after.createdAt)),
        and(
          eq(inventoryLocations.createdAt, new Date(p.after.createdAt)),
          gt(inventoryLocations.id, p.after.id),
        ),
      ),
    );
  }
  const rows = await db
    .select()
    .from(inventoryLocations)
    .where(and(...where))
    .orderBy(asc(inventoryLocations.createdAt), asc(inventoryLocations.id))
    .limit(p.limit + 1);

  const hasMore = rows.length > p.limit;
  const data = hasMore ? rows.slice(0, p.limit) : rows;
  const nextCursor = hasMore
    ? { createdAt: data[data.length - 1]!.createdAt!.toISOString(), id: data[data.length - 1]!.id }
    : null;
  return { data, nextCursor };
}

export async function getInventoryLocationRepo(id: string) {
  const [row] = await db
    .select()
    .from(inventoryLocations)
    .where(and(eq(inventoryLocations.id, id), eq(inventoryLocations.isDeleted, false)))
    .limit(1);
  return row ?? null;
}

export async function findInventoryLocationByNameRepo(branchId: string, name: string) {
  const [row] = await db
    .select({ id: inventoryLocations.id })
    .from(inventoryLocations)
    .where(
      and(
        eq(inventoryLocations.branchId, branchId),
        sql`lower(${inventoryLocations.name}) = lower(${name})`,
        eq(inventoryLocations.isDeleted, false),
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function createInventoryLocationRepo(values: typeof inventoryLocations.$inferInsert) {
  const [row] = await db.insert(inventoryLocations).values(values).returning({ id: inventoryLocations.id });
  return row;
}

export async function updateInventoryLocationRepo(
  id: string,
  patch: Partial<typeof inventoryLocations.$inferInsert>,
) {
  const [row] = await db
    .update(inventoryLocations)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(inventoryLocations.id, id))
    .returning({ id: inventoryLocations.id });
  return row ?? null;
}

export async function softDeleteInventoryLocationRepo(id: string) {
  const rows = await db
    .update(inventoryLocations)
    .set({ isDeleted: true })
    .where(eq(inventoryLocations.id, id))
    .returning({ id: inventoryLocations.id });
  return rows.length;
}

// Stock Levels
export type ListStockLevelsParams = {
  limit: number;
  after?: { updatedAt: string; id: string } | null;
  companyId?: string | null;
  productId?: string | null;
  locationId?: string | null;
};

export async function listStockLevelsRepo(p: ListStockLevelsParams) {
  const where = [];
  if (p.companyId) where.push(eq(stockLevels.companyId, p.companyId));
  if (p.productId) where.push(eq(stockLevels.productId, p.productId));
  if (p.locationId) where.push(eq(stockLevels.locationId, p.locationId));
  if (p.after) {
    where.push(
      or(
        gt(stockLevels.updatedAt, new Date(p.after.updatedAt)),
        and(eq(stockLevels.updatedAt, new Date(p.after.updatedAt)), gt(stockLevels.id, p.after.id)),
      ),
    );
  }
  const rows = await db
    .select()
    .from(stockLevels)
    .where(where.length ? and(...where) : undefined)
    .orderBy(asc(stockLevels.updatedAt), asc(stockLevels.id))
    .limit(p.limit + 1);

  const hasMore = rows.length > p.limit;
  const data = hasMore ? rows.slice(0, p.limit) : rows;
  const nextCursor = hasMore
    ? { updatedAt: data[data.length - 1]!.updatedAt!.toISOString(), id: data[data.length - 1]!.id }
    : null;
  return { data, nextCursor };
}

export async function getStockLevelRepo(productId: string, locationId: string) {
  const [row] = await db
    .select()
    .from(stockLevels)
    .where(and(eq(stockLevels.productId, productId), eq(stockLevels.locationId, locationId)))
    .limit(1);
  return row ?? null;
}

export async function upsertStockLevelRepo(values: typeof stockLevels.$inferInsert) {
  const [row] = await db
    .insert(stockLevels)
    .values(values)
    .onConflictDoUpdate({
      target: [stockLevels.productId, stockLevels.locationId],
      set: { quantity: values.quantity, updatedAt: new Date() },
    })
    .returning({ id: stockLevels.id });
  return row;
}

// Stock Movements
export type ListStockMovementsParams = {
  limit: number;
  after?: { createdAt: string; id: string } | null;
  companyId?: string | null;
  productId?: string | null;
  locationId?: string | null;
  movementType?: number | null;
};

export async function listStockMovementsRepo(p: ListStockMovementsParams) {
  const where = [];
  if (p.companyId) where.push(eq(stockMovements.companyId, p.companyId));
  if (p.productId) where.push(eq(stockMovements.productId, p.productId));
  if (p.locationId) where.push(eq(stockMovements.locationId, p.locationId));
  if (p.movementType !== undefined && p.movementType !== null)
    where.push(eq(stockMovements.movementType, p.movementType));
  if (p.after) {
    where.push(
      or(
        lt(stockMovements.createdAt, new Date(p.after.createdAt)),
        and(
          eq(stockMovements.createdAt, new Date(p.after.createdAt)),
          gt(stockMovements.id, p.after.id),
        ),
      ),
    );
  }
  const rows = await db
    .select()
    .from(stockMovements)
    .where(where.length ? and(...where) : undefined)
    .orderBy(desc(stockMovements.createdAt), asc(stockMovements.id))
    .limit(p.limit + 1);

  const hasMore = rows.length > p.limit;
  const data = hasMore ? rows.slice(0, p.limit) : rows;
  const nextCursor = hasMore
    ? { createdAt: data[data.length - 1]!.createdAt!.toISOString(), id: data[data.length - 1]!.id }
    : null;
  return { data, nextCursor };
}

export async function createStockMovementRepo(values: typeof stockMovements.$inferInsert) {
  const [row] = await db.insert(stockMovements).values(values).returning({ id: stockMovements.id });
  return row;
}

// Stock Adjustments
export type ListStockAdjustmentsParams = {
  limit: number;
  after?: { createdAt: string; id: string } | null;
  companyId?: string | null;
  productId?: string | null;
  locationId?: string | null;
};

export async function listStockAdjustmentsRepo(p: ListStockAdjustmentsParams) {
  const where = [];
  if (p.companyId) where.push(eq(stockAdjustments.companyId, p.companyId));
  if (p.productId) where.push(eq(stockAdjustments.productId, p.productId));
  if (p.locationId) where.push(eq(stockAdjustments.locationId, p.locationId));
  if (p.after) {
    where.push(
      or(
        lt(stockAdjustments.createdAt, new Date(p.after.createdAt)),
        and(
          eq(stockAdjustments.createdAt, new Date(p.after.createdAt)),
          gt(stockAdjustments.id, p.after.id),
        ),
      ),
    );
  }
  const rows = await db
    .select()
    .from(stockAdjustments)
    .where(where.length ? and(...where) : undefined)
    .orderBy(desc(stockAdjustments.createdAt), asc(stockAdjustments.id))
    .limit(p.limit + 1);

  const hasMore = rows.length > p.limit;
  const data = hasMore ? rows.slice(0, p.limit) : rows;
  const nextCursor = hasMore
    ? { createdAt: data[data.length - 1]!.createdAt!.toISOString(), id: data[data.length - 1]!.id }
    : null;
  return { data, nextCursor };
}

export async function createStockAdjustmentRepo(values: typeof stockAdjustments.$inferInsert) {
  const [row] = await db.insert(stockAdjustments).values(values).returning({ id: stockAdjustments.id });
  return row;
}

// Stock Transfers
export type ListStockTransfersParams = {
  limit: number;
  after?: { createdAt: string; id: string } | null;
  companyId?: string | null;
  productId?: string | null;
  status?: number | null;
};

export async function listStockTransfersRepo(p: ListStockTransfersParams) {
  const where = [];
  if (p.companyId) where.push(eq(stockTransfers.companyId, p.companyId));
  if (p.productId) where.push(eq(stockTransfers.productId, p.productId));
  if (p.status !== undefined && p.status !== null) where.push(eq(stockTransfers.status, p.status));
  if (p.after) {
    where.push(
      or(
        lt(stockTransfers.createdAt, new Date(p.after.createdAt)),
        and(eq(stockTransfers.createdAt, new Date(p.after.createdAt)), gt(stockTransfers.id, p.after.id)),
      ),
    );
  }
  const rows = await db
    .select()
    .from(stockTransfers)
    .where(where.length ? and(...where) : undefined)
    .orderBy(desc(stockTransfers.createdAt), asc(stockTransfers.id))
    .limit(p.limit + 1);

  const hasMore = rows.length > p.limit;
  const data = hasMore ? rows.slice(0, p.limit) : rows;
  const nextCursor = hasMore
    ? { createdAt: data[data.length - 1]!.createdAt!.toISOString(), id: data[data.length - 1]!.id }
    : null;
  return { data, nextCursor };
}

export async function getStockTransferRepo(id: string) {
  const [row] = await db.select().from(stockTransfers).where(eq(stockTransfers.id, id)).limit(1);
  return row ?? null;
}

export async function createStockTransferRepo(values: typeof stockTransfers.$inferInsert) {
  const [row] = await db.insert(stockTransfers).values(values).returning({ id: stockTransfers.id });
  return row;
}

export async function updateStockTransferRepo(
  id: string,
  patch: Partial<typeof stockTransfers.$inferInsert>,
) {
  const [row] = await db
    .update(stockTransfers)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(stockTransfers.id, id))
    .returning({ id: stockTransfers.id });
  return row ?? null;
}

// Reports
export async function getLowStockProductsRepo(companyId: string, locationId?: string | null) {
  const where = [eq(products.companyId, companyId), eq(products.isDeleted, false)];
  if (locationId) where.push(eq(stockLevels.locationId, locationId));

  const rows = await db
    .select({
      productId: products.id,
      productName: products.name,
      sku: products.sku,
      minStockLevel: products.minStockLevel,
      locationId: stockLevels.locationId,
      currentQuantity: stockLevels.quantity,
    })
    .from(products)
    .leftJoin(stockLevels, eq(products.id, stockLevels.productId))
    .where(and(...where, sql`${stockLevels.quantity} < ${products.minStockLevel}`))
    .orderBy(asc(products.name));

  return rows;
}

export type MovementHistoryParams = {
  limit: number;
  after?: { createdAt: string; id: string } | null;
  companyId: string;
  productId?: string | null;
  locationId?: string | null;
  startDate?: Date | null;
  endDate?: Date | null;
};

export async function getMovementHistoryRepo(p: MovementHistoryParams) {
  const where = [eq(stockMovements.companyId, p.companyId)];
  if (p.productId) where.push(eq(stockMovements.productId, p.productId));
  if (p.locationId) where.push(eq(stockMovements.locationId, p.locationId));
  if (p.startDate) where.push(gte(stockMovements.createdAt, p.startDate));
  if (p.endDate) where.push(lte(stockMovements.createdAt, p.endDate));
  if (p.after) {
    where.push(
      or(
        lt(stockMovements.createdAt, new Date(p.after.createdAt)),
        and(
          eq(stockMovements.createdAt, new Date(p.after.createdAt)),
          gt(stockMovements.id, p.after.id),
        ),
      ),
    );
  }

  const rows = await db
    .select()
    .from(stockMovements)
    .where(and(...where))
    .orderBy(desc(stockMovements.createdAt), asc(stockMovements.id))
    .limit(p.limit + 1);

  const hasMore = rows.length > p.limit;
  const data = hasMore ? rows.slice(0, p.limit) : rows;
  const nextCursor = hasMore
    ? { createdAt: data[data.length - 1]!.createdAt!.toISOString(), id: data[data.length - 1]!.id }
    : null;
  return { data, nextCursor };
}
