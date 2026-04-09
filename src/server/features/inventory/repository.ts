import { and, asc, count, desc, eq, gte, inArray, lte, or, sql } from 'drizzle-orm';
import { db } from '@/db/config';
import {
  productCategories,
  products,
  productUnitConversions,
  inventoryLocations,
  stockLevels,
  stockMovements,
  stockAdjustments,
  stockTransfers,
  stockRequests,
  stockRequestLines,
  stockMaintenanceRecords,
  stockAllocationPolicies,
  stockReservations,
  stockReservationAllocations,
  stockLots,
  stockLotMovements,
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

export type ProductUnitConversionRow = {
  unitOfMeasure: number;
  factorToBase: number;
  sortOrder: number;
};

export async function getProductRepo(id: string) {
  const [row] = await db
    .select()
    .from(products)
    .where(and(eq(products.id, id), eq(products.isDeleted, false)))
    .limit(1);
  return row ?? null;
}

export async function listProductUnitConversionsRepo(
  productId: string,
): Promise<ProductUnitConversionRow[]> {
  return db
    .select({
      unitOfMeasure: productUnitConversions.unitOfMeasure,
      factorToBase: productUnitConversions.factorToBase,
      sortOrder: productUnitConversions.sortOrder,
    })
    .from(productUnitConversions)
    .where(eq(productUnitConversions.productId, productId))
    .orderBy(asc(productUnitConversions.sortOrder), asc(productUnitConversions.factorToBase));
}

export async function listProductUnitConversionsByProductIdsRepo(productIds: string[]) {
  if (!productIds.length) return [];
  return db
    .select({
      productId: productUnitConversions.productId,
      unitOfMeasure: productUnitConversions.unitOfMeasure,
      factorToBase: productUnitConversions.factorToBase,
      sortOrder: productUnitConversions.sortOrder,
    })
    .from(productUnitConversions)
    .where(inArray(productUnitConversions.productId, productIds))
    .orderBy(
      asc(productUnitConversions.productId),
      asc(productUnitConversions.sortOrder),
      asc(productUnitConversions.factorToBase),
    );
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

export async function createProductUnitConversionsRepo(
  values: (typeof productUnitConversions.$inferInsert)[],
) {
  if (!values.length) return [];
  return db.insert(productUnitConversions).values(values).returning({
    id: productUnitConversions.id,
  });
}

export async function deleteProductUnitConversionsRepo(productId: string) {
  await db.delete(productUnitConversions).where(eq(productUnitConversions.productId, productId));
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
  locationType?: number | null;
  parentLocationId?: string | null;
  sort?: SortField[] | null;
};

export type InventoryLocationOptionRow = {
  id: string;
  name: string;
  branchId: string;
  locationType: number;
  parentLocationId: string | null;
};

export async function listInventoryLocationsRepo(p: ListInventoryLocationsParams) {
  const where: (ReturnType<typeof eq> | ReturnType<typeof and> | ReturnType<typeof or>)[] = [
    eq(inventoryLocations.isDeleted, false),
  ];
  if (p.companyId) where.push(eq(inventoryLocations.companyId, p.companyId));
  if (p.branchId) where.push(eq(inventoryLocations.branchId, p.branchId));
  if (p.locationType !== undefined && p.locationType !== null)
    where.push(eq(inventoryLocations.locationType, p.locationType));
  if (p.parentLocationId) where.push(eq(inventoryLocations.parentLocationId, p.parentLocationId));
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
  locationType?: number | null;
  parentLocationId?: string | null;
  search?: string | null;
}): Promise<InventoryLocationOptionRow[]> {
  const where: (ReturnType<typeof eq> | ReturnType<typeof and> | ReturnType<typeof or>)[] = [
    eq(inventoryLocations.isDeleted, false),
  ];
  if (p.companyId) where.push(eq(inventoryLocations.companyId, p.companyId));
  if (p.branchId) where.push(eq(inventoryLocations.branchId, p.branchId));
  if (p.locationType !== undefined && p.locationType !== null)
    where.push(eq(inventoryLocations.locationType, p.locationType));
  if (p.parentLocationId) where.push(eq(inventoryLocations.parentLocationId, p.parentLocationId));
  if (p.search) where.push(sql`${inventoryLocations.name} ILIKE ${`%${p.search}%`}`);

  return db
    .select({
      id: inventoryLocations.id,
      name: inventoryLocations.name,
      branchId: inventoryLocations.branchId,
      locationType: inventoryLocations.locationType,
      parentLocationId: inventoryLocations.parentLocationId,
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

// Stock Lots
export type ListStockLotsParams = {
  limit: number;
  offset: number;
  companyId: string;
  productId?: string | null;
  locationId?: string | null;
  status?: number | null;
  batchNumber?: string | null;
  sort?: SortField[] | null;
};

export async function listStockLotsRepo(p: ListStockLotsParams) {
  const where = [eq(stockLots.companyId, p.companyId)];
  if (p.productId) where.push(eq(stockLots.productId, p.productId));
  if (p.locationId) where.push(eq(stockLots.locationId, p.locationId));
  if (p.status !== undefined && p.status !== null) where.push(eq(stockLots.status, p.status));
  if (p.batchNumber) where.push(sql`${stockLots.batchNumber} ILIKE ${`%${p.batchNumber}%`}`);
  const sort = p.sort ?? [];
  const orderBy = sort.length
    ? sort
        .map((s) => {
          if (s.field === 'expiryDate')
            return s.direction === 'desc' ? desc(stockLots.expiryDate) : asc(stockLots.expiryDate);
          if (s.field === 'receivedAt')
            return s.direction === 'desc' ? desc(stockLots.receivedAt) : asc(stockLots.receivedAt);
          if (s.field === 'createdAt')
            return s.direction === 'desc' ? desc(stockLots.createdAt) : asc(stockLots.createdAt);
          if (s.field === 'id')
            return s.direction === 'desc' ? desc(stockLots.id) : asc(stockLots.id);
          return null;
        })
        .filter((value): value is ReturnType<typeof asc> => value !== null)
    : [asc(stockLots.expiryDate), asc(stockLots.receivedAt), asc(stockLots.id)];

  const [countRow] = await db
    .select({ c: count() })
    .from(stockLots)
    .where(and(...where));
  const rows = await db
    .select()
    .from(stockLots)
    .where(and(...where))
    .orderBy(...orderBy)
    .limit(p.limit)
    .offset(p.offset);
  return {
    data: rows,
    totalRecords: Number((countRow?.c as unknown as bigint) ?? 0n),
  };
}

export async function getStockLotRepo(id: string) {
  const [row] = await db.select().from(stockLots).where(eq(stockLots.id, id)).limit(1);
  return row ?? null;
}

export async function findStockLotByBatchRepo(input: {
  companyId: string;
  productId: string;
  locationId: string;
  batchNumber: string;
}) {
  const [row] = await db
    .select()
    .from(stockLots)
    .where(
      and(
        eq(stockLots.companyId, input.companyId),
        eq(stockLots.productId, input.productId),
        eq(stockLots.locationId, input.locationId),
        sql`lower(${stockLots.batchNumber}) = lower(${input.batchNumber})`,
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function createStockLotRepo(values: typeof stockLots.$inferInsert) {
  const [row] = await db.insert(stockLots).values(values).returning({ id: stockLots.id });
  return row ?? null;
}

export async function updateStockLotRepo(
  id: string,
  patch: Partial<typeof stockLots.$inferInsert>,
) {
  const [row] = await db
    .update(stockLots)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(stockLots.id, id))
    .returning({ id: stockLots.id });
  return row ?? null;
}

export async function createStockLotMovementRepo(values: typeof stockLotMovements.$inferInsert) {
  const [row] = await db
    .insert(stockLotMovements)
    .values(values)
    .returning({ id: stockLotMovements.id });
  return row ?? null;
}

export async function listStockLotMovementsRepo(lotId: string) {
  return db
    .select()
    .from(stockLotMovements)
    .where(eq(stockLotMovements.lotId, lotId))
    .orderBy(desc(stockLotMovements.createdAt), asc(stockLotMovements.id));
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

// Stock Requests
export type ListStockRequestsParams = {
  limit: number;
  offset: number;
  companyId?: string | null;
  requesterLocationId?: string | null;
  status?: number | null;
  sort?: SortField[] | null;
};

export type StockRequestLineRow = {
  id: string;
  requestId: string;
  productId: string;
  requestedQuantity: number;
  fulfilledQuantity: number;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export async function listStockRequestsRepo(p: ListStockRequestsParams) {
  const where = [];
  if (p.companyId) where.push(eq(stockRequests.companyId, p.companyId));
  if (p.requesterLocationId)
    where.push(eq(stockRequests.requesterLocationId, p.requesterLocationId));
  if (p.status !== undefined && p.status !== null) where.push(eq(stockRequests.status, p.status));

  const sort = p.sort ?? [];
  const orderBy = sort.length
    ? sort
        .map((s) => {
          if (s.field === 'createdAt')
            return s.direction === 'desc'
              ? desc(stockRequests.createdAt)
              : asc(stockRequests.createdAt);
          if (s.field === 'id')
            return s.direction === 'desc' ? desc(stockRequests.id) : asc(stockRequests.id);
          return null;
        })
        .filter((value): value is ReturnType<typeof asc> => value !== null)
    : [desc(stockRequests.createdAt), asc(stockRequests.id)];

  const [countRow] = await db
    .select({ c: count() })
    .from(stockRequests)
    .where(where.length ? and(...where) : undefined);
  const totalRecords = Number((countRow?.c as unknown as bigint) ?? 0n);

  const rows = await db
    .select()
    .from(stockRequests)
    .where(where.length ? and(...where) : undefined)
    .orderBy(...orderBy)
    .limit(p.limit)
    .offset(p.offset);

  return { data: rows, totalRecords };
}

export async function getStockRequestRepo(id: string) {
  const [row] = await db.select().from(stockRequests).where(eq(stockRequests.id, id)).limit(1);
  return row ?? null;
}

export async function listStockRequestLinesRepo(requestId: string): Promise<StockRequestLineRow[]> {
  return db
    .select()
    .from(stockRequestLines)
    .where(eq(stockRequestLines.requestId, requestId))
    .orderBy(asc(stockRequestLines.createdAt), asc(stockRequestLines.id));
}

export async function getStockRequestLineRepo(id: string) {
  const [row] = await db
    .select()
    .from(stockRequestLines)
    .where(eq(stockRequestLines.id, id))
    .limit(1);
  return row ?? null;
}

export async function createStockRequestRepo(values: typeof stockRequests.$inferInsert) {
  const [row] = await db.insert(stockRequests).values(values).returning({ id: stockRequests.id });
  return row;
}

export async function createStockRequestLinesRepo(
  values: (typeof stockRequestLines.$inferInsert)[],
) {
  if (!values.length) return [];
  return db.insert(stockRequestLines).values(values).returning({ id: stockRequestLines.id });
}

export async function updateStockRequestRepo(
  id: string,
  patch: Partial<typeof stockRequests.$inferInsert>,
) {
  const [row] = await db
    .update(stockRequests)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(stockRequests.id, id))
    .returning({ id: stockRequests.id });
  return row ?? null;
}

export async function updateStockRequestLineRepo(
  id: string,
  patch: Partial<typeof stockRequestLines.$inferInsert>,
) {
  const [row] = await db
    .update(stockRequestLines)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(stockRequestLines.id, id))
    .returning({ id: stockRequestLines.id });
  return row ?? null;
}

// Stock Allocation Policies
export async function getStockAllocationPolicyRepo(
  companyId: string,
  requesterRootLocationId?: string | null,
) {
  const [specific] = await db
    .select()
    .from(stockAllocationPolicies)
    .where(
      and(
        eq(stockAllocationPolicies.companyId, companyId),
        eq(stockAllocationPolicies.active, true),
        requesterRootLocationId
          ? eq(stockAllocationPolicies.requesterRootLocationId, requesterRootLocationId)
          : sql`false`,
      ),
    )
    .orderBy(desc(stockAllocationPolicies.updatedAt))
    .limit(1);
  if (specific) return specific;

  const [global] = await db
    .select()
    .from(stockAllocationPolicies)
    .where(
      and(
        eq(stockAllocationPolicies.companyId, companyId),
        eq(stockAllocationPolicies.active, true),
        sql`${stockAllocationPolicies.requesterRootLocationId} is null`,
      ),
    )
    .orderBy(desc(stockAllocationPolicies.updatedAt))
    .limit(1);
  return global ?? null;
}

export async function upsertStockAllocationPolicyRepo(input: {
  companyId: string;
  requesterRootLocationId?: string | null;
  strategy: number;
  allowPartial: boolean;
  prioritizeSameBranch: boolean;
  maxSourceLocations: number;
  active: boolean;
  createdBy: string;
}) {
  const existing = await db
    .select({ id: stockAllocationPolicies.id })
    .from(stockAllocationPolicies)
    .where(
      and(
        eq(stockAllocationPolicies.companyId, input.companyId),
        input.requesterRootLocationId
          ? eq(stockAllocationPolicies.requesterRootLocationId, input.requesterRootLocationId)
          : sql`${stockAllocationPolicies.requesterRootLocationId} is null`,
      ),
    )
    .limit(1);

  if (existing[0]) {
    const [updated] = await db
      .update(stockAllocationPolicies)
      .set({
        strategy: input.strategy,
        allowPartial: input.allowPartial,
        prioritizeSameBranch: input.prioritizeSameBranch,
        maxSourceLocations: input.maxSourceLocations,
        active: input.active,
        updatedAt: new Date(),
      })
      .where(eq(stockAllocationPolicies.id, existing[0].id))
      .returning({ id: stockAllocationPolicies.id });
    return updated ?? null;
  }

  const [created] = await db
    .insert(stockAllocationPolicies)
    .values({
      companyId: input.companyId,
      requesterRootLocationId: input.requesterRootLocationId ?? null,
      strategy: input.strategy,
      allowPartial: input.allowPartial,
      prioritizeSameBranch: input.prioritizeSameBranch,
      maxSourceLocations: input.maxSourceLocations,
      active: input.active,
      createdBy: input.createdBy,
    })
    .returning({ id: stockAllocationPolicies.id });
  return created ?? null;
}

// Stock Reservations
export type ListStockReservationsParams = {
  limit: number;
  offset: number;
  companyId: string;
  status?: number | null;
  requestId?: string | null;
  productId?: string | null;
  sort?: SortField[] | null;
};

export async function listStockReservationsRepo(p: ListStockReservationsParams) {
  const where = [eq(stockReservations.companyId, p.companyId)];
  if (p.status !== undefined && p.status !== null)
    where.push(eq(stockReservations.status, p.status));
  if (p.requestId) where.push(eq(stockReservations.requestId, p.requestId));
  if (p.productId) where.push(eq(stockReservations.productId, p.productId));
  const sort = p.sort ?? [];
  const orderBy = sort.length
    ? sort
        .map((s) => {
          if (s.field === 'createdAt')
            return s.direction === 'desc'
              ? desc(stockReservations.createdAt)
              : asc(stockReservations.createdAt);
          if (s.field === 'id')
            return s.direction === 'desc' ? desc(stockReservations.id) : asc(stockReservations.id);
          return null;
        })
        .filter((value): value is ReturnType<typeof asc> => value !== null)
    : [desc(stockReservations.createdAt), asc(stockReservations.id)];

  const [countRow] = await db
    .select({ c: count() })
    .from(stockReservations)
    .where(and(...where));
  const rows = await db
    .select()
    .from(stockReservations)
    .where(and(...where))
    .orderBy(...orderBy)
    .limit(p.limit)
    .offset(p.offset);

  return {
    data: rows,
    totalRecords: Number((countRow?.c as unknown as bigint) ?? 0n),
  };
}

export async function getStockReservationRepo(id: string) {
  const [row] = await db
    .select()
    .from(stockReservations)
    .where(eq(stockReservations.id, id))
    .limit(1);
  return row ?? null;
}

export async function getStockReservationByLineRepo(requestLineId: string) {
  const [row] = await db
    .select()
    .from(stockReservations)
    .where(eq(stockReservations.requestLineId, requestLineId))
    .limit(1);
  return row ?? null;
}

export async function createStockReservationRepo(values: typeof stockReservations.$inferInsert) {
  const [row] = await db
    .insert(stockReservations)
    .values(values)
    .returning({ id: stockReservations.id });
  return row ?? null;
}

export async function updateStockReservationRepo(
  id: string,
  patch: Partial<typeof stockReservations.$inferInsert>,
) {
  const [row] = await db
    .update(stockReservations)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(stockReservations.id, id))
    .returning({ id: stockReservations.id });
  return row ?? null;
}

export async function listStockReservationAllocationsRepo(reservationId: string) {
  return db
    .select()
    .from(stockReservationAllocations)
    .where(eq(stockReservationAllocations.reservationId, reservationId))
    .orderBy(asc(stockReservationAllocations.sequenceNo), asc(stockReservationAllocations.id));
}

export async function createStockReservationAllocationsRepo(
  values: (typeof stockReservationAllocations.$inferInsert)[],
) {
  if (!values.length) return [];
  return db.insert(stockReservationAllocations).values(values).returning({
    id: stockReservationAllocations.id,
  });
}

export async function updateStockReservationAllocationRepo(
  id: string,
  patch: Partial<typeof stockReservationAllocations.$inferInsert>,
) {
  const [row] = await db
    .update(stockReservationAllocations)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(stockReservationAllocations.id, id))
    .returning({ id: stockReservationAllocations.id });
  return row ?? null;
}

export async function releaseReservationAllocationsRepo(reservationId: string) {
  await db
    .update(stockReservationAllocations)
    .set({ status: 1, updatedAt: new Date() })
    .where(
      and(
        eq(stockReservationAllocations.reservationId, reservationId),
        eq(stockReservationAllocations.status, 0),
      ),
    );
}

export async function listReservedByProductLocationRepo(
  companyId: string,
  productId: string,
  locationIds: string[],
) {
  if (!locationIds.length) return [];
  return db
    .select({
      sourceLocationId: stockReservationAllocations.sourceLocationId,
      reservedQuantity: sql<number>`coalesce(sum(${stockReservationAllocations.reservedQuantity} - ${stockReservationAllocations.issuedQuantity}), 0)`,
    })
    .from(stockReservationAllocations)
    .innerJoin(
      stockReservations,
      eq(stockReservations.id, stockReservationAllocations.reservationId),
    )
    .where(
      and(
        eq(stockReservations.companyId, companyId),
        eq(stockReservations.productId, productId),
        inArray(stockReservationAllocations.sourceLocationId, locationIds),
        eq(stockReservationAllocations.status, 0),
      ),
    )
    .groupBy(stockReservationAllocations.sourceLocationId);
}

export async function getReservationExceptionsSummaryRepo(companyId: string) {
  const [totals] = await db
    .select({
      openCount: sql<number>`coalesce(sum(case when ${stockReservations.status} in (0,1,2) then 1 else 0 end), 0)`,
      shortCount: sql<number>`coalesce(sum(case when ${stockReservations.status} = 4 then 1 else 0 end), 0)`,
      shortQty: sql<number>`coalesce(sum(${stockReservations.shortQuantity}), 0)`,
      pendingQty: sql<number>`coalesce(sum(greatest(${stockReservations.requestedQuantity} - ${stockReservations.issuedQuantity}, 0)), 0)`,
    })
    .from(stockReservations)
    .where(eq(stockReservations.companyId, companyId));
  return {
    openCount: Number(totals?.openCount ?? 0),
    shortCount: Number(totals?.shortCount ?? 0),
    shortQty: Number(totals?.shortQty ?? 0),
    pendingQty: Number(totals?.pendingQty ?? 0),
  };
}

// Inventory Dashboard / Scope
export async function listLocationScopeIdsRepo(companyId: string, rootLocationId?: string | null) {
  if (!rootLocationId) {
    const rows = await db
      .select({ id: inventoryLocations.id })
      .from(inventoryLocations)
      .where(
        and(eq(inventoryLocations.companyId, companyId), eq(inventoryLocations.isDeleted, false)),
      );
    return rows.map((row) => row.id);
  }

  const result = await db.execute(sql`
    WITH RECURSIVE location_tree AS (
      SELECT id, parent_location_id
      FROM inventory_locations
      WHERE id = ${rootLocationId}
        AND company_id = ${companyId}
        AND is_deleted = false
      UNION ALL
      SELECT child.id, child.parent_location_id
      FROM inventory_locations child
      INNER JOIN location_tree parent ON child.parent_location_id = parent.id
      WHERE child.company_id = ${companyId}
        AND child.is_deleted = false
    )
    SELECT id FROM location_tree
  `);

  return (result as unknown as { rows: { id: string }[] }).rows.map((row) => row.id);
}

export async function getInventoryDashboardSummaryRepo(filters: {
  companyId: string;
  locationId?: string | null;
  lowStockLimit?: number;
}) {
  const scopeIds = await listLocationScopeIdsRepo(filters.companyId, filters.locationId ?? null);
  if (!scopeIds.length) {
    return {
      totals: {
        totalLocations: 0,
        totalSkus: 0,
        totalQuantity: 0,
        lowStockCount: 0,
        outOfStockCount: 0,
        openMaintenanceQty: 0,
        missingQty: 0,
      },
      lowStockItems: [],
      openMaintenanceItems: [],
      scopeLocationIds: [],
    };
  }

  const productBalances = await db
    .select({
      productId: products.id,
      productName: products.name,
      productSku: products.sku,
      minStockLevel: products.minStockLevel,
      isRecoverable: products.isRecoverable,
      quantity: sql<number>`coalesce(sum(${stockLevels.quantity}), 0)`,
    })
    .from(products)
    .leftJoin(
      stockLevels,
      and(
        eq(stockLevels.productId, products.id),
        eq(stockLevels.companyId, filters.companyId),
        inArray(stockLevels.locationId, scopeIds),
      ),
    )
    .where(and(eq(products.companyId, filters.companyId), eq(products.isDeleted, false)))
    .groupBy(products.id)
    .orderBy(asc(products.name));

  const totalQuantity = productBalances.reduce((sum, row) => sum + Number(row.quantity ?? 0), 0);
  const lowStockRows = productBalances.filter(
    (row) => Number(row.quantity ?? 0) < Number(row.minStockLevel ?? 0),
  );
  const outOfStockRows = productBalances.filter((row) => Number(row.quantity ?? 0) <= 0);
  const lowStockLimit = Math.max(1, filters.lowStockLimit ?? 20);

  const maintenanceAgg = await db
    .select({
      issueType: stockMaintenanceRecords.issueType,
      openQuantity: sql<number>`coalesce(sum(greatest(${stockMaintenanceRecords.quantity} - ${stockMaintenanceRecords.quantityReturned} - ${stockMaintenanceRecords.quantityDisposed}, 0)), 0)`,
    })
    .from(stockMaintenanceRecords)
    .where(
      and(
        eq(stockMaintenanceRecords.companyId, filters.companyId),
        eq(stockMaintenanceRecords.status, 0),
        inArray(stockMaintenanceRecords.locationId, scopeIds),
      ),
    )
    .groupBy(stockMaintenanceRecords.issueType);

  const openMaintenanceQty =
    maintenanceAgg.find((row) => Number(row.issueType) === 0)?.openQuantity ?? 0;
  const missingQty = maintenanceAgg.find((row) => Number(row.issueType) === 2)?.openQuantity ?? 0;

  const openMaintenanceItems = await db
    .select({
      id: stockMaintenanceRecords.id,
      productId: stockMaintenanceRecords.productId,
      productName: products.name,
      locationId: stockMaintenanceRecords.locationId,
      locationName: inventoryLocations.name,
      issueType: stockMaintenanceRecords.issueType,
      quantity: stockMaintenanceRecords.quantity,
      quantityReturned: stockMaintenanceRecords.quantityReturned,
      quantityDisposed: stockMaintenanceRecords.quantityDisposed,
      createdAt: stockMaintenanceRecords.createdAt,
    })
    .from(stockMaintenanceRecords)
    .innerJoin(products, eq(products.id, stockMaintenanceRecords.productId))
    .innerJoin(inventoryLocations, eq(inventoryLocations.id, stockMaintenanceRecords.locationId))
    .where(
      and(
        eq(stockMaintenanceRecords.companyId, filters.companyId),
        eq(stockMaintenanceRecords.status, 0),
        inArray(stockMaintenanceRecords.locationId, scopeIds),
      ),
    )
    .orderBy(desc(stockMaintenanceRecords.createdAt))
    .limit(20);

  return {
    totals: {
      totalLocations: scopeIds.length,
      totalSkus: productBalances.filter((row) => Number(row.quantity ?? 0) > 0).length,
      totalQuantity,
      lowStockCount: lowStockRows.length,
      outOfStockCount: outOfStockRows.length,
      openMaintenanceQty: Number(openMaintenanceQty),
      missingQty: Number(missingQty),
    },
    lowStockItems: lowStockRows.slice(0, lowStockLimit),
    openMaintenanceItems,
    scopeLocationIds: scopeIds,
  };
}

// Stock Maintenance
export type ListStockMaintenanceRecordsParams = {
  limit: number;
  offset: number;
  companyId?: string | null;
  locationId?: string | null;
  issueType?: number | null;
  status?: number | null;
  sort?: SortField[] | null;
};

export async function listStockMaintenanceRecordsRepo(p: ListStockMaintenanceRecordsParams) {
  const where = [];
  if (p.companyId) where.push(eq(stockMaintenanceRecords.companyId, p.companyId));
  if (p.locationId) where.push(eq(stockMaintenanceRecords.locationId, p.locationId));
  if (p.issueType !== undefined && p.issueType !== null)
    where.push(eq(stockMaintenanceRecords.issueType, p.issueType));
  if (p.status !== undefined && p.status !== null)
    where.push(eq(stockMaintenanceRecords.status, p.status));
  const sort = p.sort ?? [];
  const orderBy = sort.length
    ? sort
        .map((s) => {
          if (s.field === 'createdAt')
            return s.direction === 'desc'
              ? desc(stockMaintenanceRecords.createdAt)
              : asc(stockMaintenanceRecords.createdAt);
          if (s.field === 'id')
            return s.direction === 'desc'
              ? desc(stockMaintenanceRecords.id)
              : asc(stockMaintenanceRecords.id);
          return null;
        })
        .filter((value): value is ReturnType<typeof asc> => value !== null)
    : [desc(stockMaintenanceRecords.createdAt), asc(stockMaintenanceRecords.id)];

  const [countRow] = await db
    .select({ c: count() })
    .from(stockMaintenanceRecords)
    .where(where.length ? and(...where) : undefined);
  const totalRecords = Number((countRow?.c as unknown as bigint) ?? 0n);

  const rows = await db
    .select()
    .from(stockMaintenanceRecords)
    .where(where.length ? and(...where) : undefined)
    .orderBy(...orderBy)
    .limit(p.limit)
    .offset(p.offset);

  return { data: rows, totalRecords };
}

export async function getStockMaintenanceRecordRepo(id: string) {
  const [row] = await db
    .select()
    .from(stockMaintenanceRecords)
    .where(eq(stockMaintenanceRecords.id, id))
    .limit(1);
  return row ?? null;
}

export async function createStockMaintenanceRecordRepo(
  values: typeof stockMaintenanceRecords.$inferInsert,
) {
  const [row] = await db
    .insert(stockMaintenanceRecords)
    .values(values)
    .returning({ id: stockMaintenanceRecords.id });
  return row;
}

export async function updateStockMaintenanceRecordRepo(
  id: string,
  patch: Partial<typeof stockMaintenanceRecords.$inferInsert>,
) {
  const [row] = await db
    .update(stockMaintenanceRecords)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(stockMaintenanceRecords.id, id))
    .returning({ id: stockMaintenanceRecords.id });
  return row ?? null;
}
