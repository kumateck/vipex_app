import { and, asc, count, desc, eq, gt, gte, lte, lt, or, sql } from 'drizzle-orm';
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
import type { SortField } from '@/server/types/pagination.types';

// Product Categories
export type ListProductCategoriesParams = {
  limit: number;
  offset: number;
  companyId?: string | null;
  sort?: SortField[] | null;
};

export type ProductCategoryOptionRow = {
  id: string;
  name: string;
};

export async function listProductCategoriesRepo(p: ListProductCategoriesParams) {
  const where: (ReturnType<typeof eq> | ReturnType<typeof and> | ReturnType<typeof or>)[] = [
    eq(productCategories.isDeleted, false),
  ];
  if (p.companyId) where.push(eq(productCategories.companyId, p.companyId));
  const sort = p.sort ?? [];
  const orderBy = sort.length
    ? sort
        .map((s) => {
          if (s.field === 'createdAt')
            return s.direction === 'desc'
              ? desc(productCategories.createdAt)
              : asc(productCategories.createdAt);
          if (s.field === 'name')
            return s.direction === 'desc'
              ? desc(productCategories.name)
              : asc(productCategories.name);
          if (s.field === 'id')
            return s.direction === 'desc' ? desc(productCategories.id) : asc(productCategories.id);
          return null;
        })
        .filter((value): value is ReturnType<typeof asc> => value !== null)
    : [asc(productCategories.createdAt), asc(productCategories.id)];

  const [countRow] = await db
    .select({ c: count() })
    .from(productCategories)
    .where(and(...where));
  const totalRecords = Number((countRow?.c as unknown as bigint) ?? 0n);

  const rows = await db
    .select()
    .from(productCategories)
    .where(and(...where))
    .orderBy(...orderBy)
    .limit(p.limit)
    .offset(p.offset);

  return { data: rows, totalRecords };
}

export async function getProductCategoryRepo(id: string) {
  const [row] = await db
    .select()
    .from(productCategories)
    .where(and(eq(productCategories.id, id), eq(productCategories.isDeleted, false)))
    .limit(1);
  return row ?? null;
}

export async function listProductCategoryOptionsRepo(p: {
  companyId?: string | null;
  search?: string | null;
}): Promise<ProductCategoryOptionRow[]> {
  const where: (ReturnType<typeof eq> | ReturnType<typeof and> | ReturnType<typeof or>)[] = [
    eq(productCategories.isDeleted, false),
  ];
  if (p.companyId) where.push(eq(productCategories.companyId, p.companyId));
  if (p.search) where.push(sql`${productCategories.name} ILIKE ${`%${p.search}%`}`);

  return db
    .select({
      id: productCategories.id,
      name: productCategories.name,
    })
    .from(productCategories)
    .where(and(...where))
    .orderBy(asc(productCategories.name), asc(productCategories.id));
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
  const [row] = await db
    .insert(productCategories)
    .values(values)
    .returning({ id: productCategories.id });
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
  offset: number;
  companyId?: string | null;
  categoryId?: string | null;
  sort?: SortField[] | null;
};

export type ProductOptionRow = {
  id: string;
  name: string;
  sku: string;
};

export async function listProductsRepo(p: ListProductsParams) {
  const where = [eq(products.isDeleted, false)];
  if (p.companyId) where.push(eq(products.companyId, p.companyId));
  if (p.categoryId) where.push(eq(products.categoryId, p.categoryId));
  const sort = p.sort ?? [];
  const orderBy = sort.length
    ? sort
        .map((s) => {
          if (s.field === 'createdAt')
            return s.direction === 'desc' ? desc(products.createdAt) : asc(products.createdAt);
          if (s.field === 'name')
            return s.direction === 'desc' ? desc(products.name) : asc(products.name);
          if (s.field === 'sku')
            return s.direction === 'desc' ? desc(products.sku) : asc(products.sku);
          if (s.field === 'id')
            return s.direction === 'desc' ? desc(products.id) : asc(products.id);
          return null;
        })
        .filter((value): value is ReturnType<typeof asc> => value !== null)
    : [asc(products.createdAt), asc(products.id)];

  const [countRow] = await db
    .select({ c: count() })
    .from(products)
    .where(and(...where));
  const totalRecords = Number((countRow?.c as unknown as bigint) ?? 0n);
  const rows = await db
    .select()
    .from(products)
    .where(and(...where))
    .orderBy(...orderBy)
    .limit(p.limit)
    .offset(p.offset);

  return { data: rows, totalRecords };
}

export async function getProductRepo(id: string) {
  const [row] = await db
    .select()
    .from(products)
    .where(and(eq(products.id, id), eq(products.isDeleted, false)))
    .limit(1);
  return row ?? null;
}

export async function listProductOptionsRepo(p: {
  companyId?: string | null;
  categoryId?: string | null;
  search?: string | null;
}): Promise<ProductOptionRow[]> {
  const where = [eq(products.isDeleted, false)];
  if (p.companyId) where.push(eq(products.companyId, p.companyId));
  if (p.categoryId) where.push(eq(products.categoryId, p.categoryId));
  if (p.search) {
    const term = `%${p.search}%`;
    where.push(sql`(${products.name} ILIKE ${term} OR ${products.sku} ILIKE ${term})`);
  }

  return db
    .select({
      id: products.id,
      name: products.name,
      sku: products.sku,
    })
    .from(products)
    .where(and(...where))
    .orderBy(asc(products.name), asc(products.id));
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
  offset: number;
  companyId?: string | null;
  branchId?: string | null;
  sort?: SortField[] | null;
};

export type InventoryLocationOptionRow = {
  id: string;
  name: string;
  branchId: string;
};

export async function listInventoryLocationsRepo(p: ListInventoryLocationsParams) {
  const where: (ReturnType<typeof eq> | ReturnType<typeof and> | ReturnType<typeof or>)[] = [
    eq(inventoryLocations.isDeleted, false),
  ];
  if (p.companyId) where.push(eq(inventoryLocations.companyId, p.companyId));
  if (p.branchId) where.push(eq(inventoryLocations.branchId, p.branchId));
  const sort = p.sort ?? [];
  const orderBy = sort.length
    ? sort
        .map((s) => {
          if (s.field === 'createdAt')
            return s.direction === 'desc'
              ? desc(inventoryLocations.createdAt)
              : asc(inventoryLocations.createdAt);
          if (s.field === 'name')
            return s.direction === 'desc'
              ? desc(inventoryLocations.name)
              : asc(inventoryLocations.name);
          if (s.field === 'id')
            return s.direction === 'desc'
              ? desc(inventoryLocations.id)
              : asc(inventoryLocations.id);
          return null;
        })
        .filter((value): value is ReturnType<typeof asc> => value !== null)
    : [asc(inventoryLocations.createdAt), asc(inventoryLocations.id)];

  const [countRow] = await db
    .select({ c: count() })
    .from(inventoryLocations)
    .where(and(...where));
  const totalRecords = Number((countRow?.c as unknown as bigint) ?? 0n);
  const rows = await db
    .select()
    .from(inventoryLocations)
    .where(and(...where))
    .orderBy(...orderBy)
    .limit(p.limit)
    .offset(p.offset);

  return { data: rows, totalRecords };
}

export async function getInventoryLocationRepo(id: string) {
  const [row] = await db
    .select()
    .from(inventoryLocations)
    .where(and(eq(inventoryLocations.id, id), eq(inventoryLocations.isDeleted, false)))
    .limit(1);
  return row ?? null;
}

export async function listInventoryLocationOptionsRepo(p: {
  companyId?: string | null;
  branchId?: string | null;
  search?: string | null;
}): Promise<InventoryLocationOptionRow[]> {
  const where: (ReturnType<typeof eq> | ReturnType<typeof and> | ReturnType<typeof or>)[] = [
    eq(inventoryLocations.isDeleted, false),
  ];
  if (p.companyId) where.push(eq(inventoryLocations.companyId, p.companyId));
  if (p.branchId) where.push(eq(inventoryLocations.branchId, p.branchId));
  if (p.search) where.push(sql`${inventoryLocations.name} ILIKE ${`%${p.search}%`}`);

  return db
    .select({
      id: inventoryLocations.id,
      name: inventoryLocations.name,
      branchId: inventoryLocations.branchId,
    })
    .from(inventoryLocations)
    .where(and(...where))
    .orderBy(asc(inventoryLocations.name), asc(inventoryLocations.id));
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
  const [row] = await db
    .insert(inventoryLocations)
    .values(values)
    .returning({ id: inventoryLocations.id });
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
  offset: number;
  companyId?: string | null;
  productId?: string | null;
  locationId?: string | null;
  sort?: SortField[] | null;
};

export async function listStockLevelsRepo(p: ListStockLevelsParams) {
  const where = [];
  if (p.companyId) where.push(eq(stockLevels.companyId, p.companyId));
  if (p.productId) where.push(eq(stockLevels.productId, p.productId));
  if (p.locationId) where.push(eq(stockLevels.locationId, p.locationId));
  const sort = p.sort ?? [];
  const orderBy = sort.length
    ? sort
        .map((s) => {
          if (s.field === 'updatedAt')
            return s.direction === 'desc'
              ? desc(stockLevels.updatedAt)
              : asc(stockLevels.updatedAt);
          if (s.field === 'id')
            return s.direction === 'desc' ? desc(stockLevels.id) : asc(stockLevels.id);
          return null;
        })
        .filter((value): value is ReturnType<typeof asc> => value !== null)
    : [asc(stockLevels.updatedAt), asc(stockLevels.id)];

  const [countRow] = await db
    .select({ c: count() })
    .from(stockLevels)
    .where(where.length ? and(...where) : undefined);
  const totalRecords = Number((countRow?.c as unknown as bigint) ?? 0n);
  const rows = await db
    .select()
    .from(stockLevels)
    .where(where.length ? and(...where) : undefined)
    .orderBy(...orderBy)
    .limit(p.limit)
    .offset(p.offset);

  return { data: rows, totalRecords };
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
  offset: number;
  companyId?: string | null;
  productId?: string | null;
  locationId?: string | null;
  movementType?: number | null;
  sort?: SortField[] | null;
};

export async function listStockMovementsRepo(p: ListStockMovementsParams) {
  const where = [];
  if (p.companyId) where.push(eq(stockMovements.companyId, p.companyId));
  if (p.productId) where.push(eq(stockMovements.productId, p.productId));
  if (p.locationId) where.push(eq(stockMovements.locationId, p.locationId));
  if (p.movementType !== undefined && p.movementType !== null)
    where.push(eq(stockMovements.movementType, p.movementType));
  const sort = p.sort ?? [];
  const orderBy = sort.length
    ? sort
        .map((s) => {
          if (s.field === 'createdAt')
            return s.direction === 'desc'
              ? desc(stockMovements.createdAt)
              : asc(stockMovements.createdAt);
          if (s.field === 'id')
            return s.direction === 'desc' ? desc(stockMovements.id) : asc(stockMovements.id);
          return null;
        })
        .filter((value): value is ReturnType<typeof asc> => value !== null)
    : [desc(stockMovements.createdAt), asc(stockMovements.id)];

  const [countRow] = await db
    .select({ c: count() })
    .from(stockMovements)
    .where(where.length ? and(...where) : undefined);
  const totalRecords = Number((countRow?.c as unknown as bigint) ?? 0n);
  const rows = await db
    .select()
    .from(stockMovements)
    .where(where.length ? and(...where) : undefined)
    .orderBy(...orderBy)
    .limit(p.limit)
    .offset(p.offset);

  return { data: rows, totalRecords };
}

export async function createStockMovementRepo(values: typeof stockMovements.$inferInsert) {
  const [row] = await db.insert(stockMovements).values(values).returning({ id: stockMovements.id });
  return row;
}

// Stock Adjustments
export type ListStockAdjustmentsParams = {
  limit: number;
  offset: number;
  companyId?: string | null;
  productId?: string | null;
  locationId?: string | null;
  sort?: SortField[] | null;
};

export async function listStockAdjustmentsRepo(p: ListStockAdjustmentsParams) {
  const where = [];
  if (p.companyId) where.push(eq(stockAdjustments.companyId, p.companyId));
  if (p.productId) where.push(eq(stockAdjustments.productId, p.productId));
  if (p.locationId) where.push(eq(stockAdjustments.locationId, p.locationId));
  const sort = p.sort ?? [];
  const orderBy = sort.length
    ? sort
        .map((s) => {
          if (s.field === 'createdAt')
            return s.direction === 'desc'
              ? desc(stockAdjustments.createdAt)
              : asc(stockAdjustments.createdAt);
          if (s.field === 'id')
            return s.direction === 'desc' ? desc(stockAdjustments.id) : asc(stockAdjustments.id);
          return null;
        })
        .filter((value): value is ReturnType<typeof asc> => value !== null)
    : [desc(stockAdjustments.createdAt), asc(stockAdjustments.id)];

  const [countRow] = await db
    .select({ c: count() })
    .from(stockAdjustments)
    .where(where.length ? and(...where) : undefined);
  const totalRecords = Number((countRow?.c as unknown as bigint) ?? 0n);
  const rows = await db
    .select()
    .from(stockAdjustments)
    .where(where.length ? and(...where) : undefined)
    .orderBy(...orderBy)
    .limit(p.limit)
    .offset(p.offset);

  return { data: rows, totalRecords };
}

export async function createStockAdjustmentRepo(values: typeof stockAdjustments.$inferInsert) {
  const [row] = await db
    .insert(stockAdjustments)
    .values(values)
    .returning({ id: stockAdjustments.id });
  return row;
}

// Stock Transfers
export type ListStockTransfersParams = {
  limit: number;
  offset: number;
  companyId?: string | null;
  productId?: string | null;
  status?: number | null;
  sort?: SortField[] | null;
};

export async function listStockTransfersRepo(p: ListStockTransfersParams) {
  const where = [];
  if (p.companyId) where.push(eq(stockTransfers.companyId, p.companyId));
  if (p.productId) where.push(eq(stockTransfers.productId, p.productId));
  if (p.status !== undefined && p.status !== null) where.push(eq(stockTransfers.status, p.status));
  const sort = p.sort ?? [];
  const orderBy = sort.length
    ? sort
        .map((s) => {
          if (s.field === 'createdAt')
            return s.direction === 'desc'
              ? desc(stockTransfers.createdAt)
              : asc(stockTransfers.createdAt);
          if (s.field === 'id')
            return s.direction === 'desc' ? desc(stockTransfers.id) : asc(stockTransfers.id);
          return null;
        })
        .filter((value): value is ReturnType<typeof asc> => value !== null)
    : [desc(stockTransfers.createdAt), asc(stockTransfers.id)];

  const [countRow] = await db
    .select({ c: count() })
    .from(stockTransfers)
    .where(where.length ? and(...where) : undefined);
  const totalRecords = Number((countRow?.c as unknown as bigint) ?? 0n);
  const rows = await db
    .select()
    .from(stockTransfers)
    .where(where.length ? and(...where) : undefined)
    .orderBy(...orderBy)
    .limit(p.limit)
    .offset(p.offset);

  return { data: rows, totalRecords };
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
export async function getLowStockProductsRepo(filters: {
  companyId?: string | null;
  branchId?: string | null;
  locationId?: string | null;
}) {
  const where = [eq(products.isDeleted, false)];
  if (filters.companyId) where.push(eq(products.companyId, filters.companyId));
  if (filters.branchId) where.push(eq(inventoryLocations.branchId, filters.branchId));
  if (filters.locationId) where.push(eq(stockLevels.locationId, filters.locationId));

  const rows = await db
    .select({
      productId: products.id,
      productName: products.name,
      productSku: products.sku,
      minStockLevel: products.minStockLevel,
      locationId: stockLevels.locationId,
      quantity: stockLevels.quantity,
      locationName: inventoryLocations.name,
    })
    .from(products)
    .leftJoin(stockLevels, eq(products.id, stockLevels.productId))
    .leftJoin(inventoryLocations, eq(stockLevels.locationId, inventoryLocations.id))
    .where(and(...where, sql`${stockLevels.quantity} < ${products.minStockLevel}`))
    .orderBy(asc(products.name));

  return rows;
}

export type MovementHistoryParams = {
  limit: number;
  offset: number;
  companyId: string;
  productId?: string | null;
  locationId?: string | null;
  startDate?: Date | null;
  endDate?: Date | null;
  sort?: SortField[] | null;
};

export async function getMovementHistoryRepo(p: MovementHistoryParams) {
  const where = [eq(stockMovements.companyId, p.companyId)];
  if (p.productId) where.push(eq(stockMovements.productId, p.productId));
  if (p.locationId) where.push(eq(stockMovements.locationId, p.locationId));
  if (p.startDate) where.push(gte(stockMovements.createdAt, p.startDate));
  if (p.endDate) where.push(lte(stockMovements.createdAt, p.endDate));
  const sort = p.sort ?? [];
  const orderBy = sort.length
    ? sort
        .map((s) => {
          if (s.field === 'createdAt')
            return s.direction === 'desc'
              ? desc(stockMovements.createdAt)
              : asc(stockMovements.createdAt);
          if (s.field === 'id')
            return s.direction === 'desc' ? desc(stockMovements.id) : asc(stockMovements.id);
          return null;
        })
        .filter((value): value is ReturnType<typeof asc> => value !== null)
    : [desc(stockMovements.createdAt), asc(stockMovements.id)];

  const [countRow] = await db
    .select({ c: count() })
    .from(stockMovements)
    .where(and(...where));
  const totalRecords = Number((countRow?.c as unknown as bigint) ?? 0n);

  const rows = await db
    .select()
    .from(stockMovements)
    .where(and(...where))
    .orderBy(...orderBy)
    .limit(p.limit)
    .offset(p.offset);

  return { data: rows, totalRecords };
}
