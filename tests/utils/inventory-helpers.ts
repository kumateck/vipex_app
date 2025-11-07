// Test helpers for inventory system
import { db } from '@/db/client';
import {
  productCategories,
  products,
  inventoryLocations,
  stockLevels,
  stockMovements,
  stockAdjustments,
  stockTransfers,
  companies,
  branches,
  users,
  roles,
} from '@/db/schemas';
import { eq, inArray } from 'drizzle-orm';
import {
  UnitOfMeasure,
  StockMovementType,
  StockAdjustmentReason,
  // TransferStatus,
  UserStatus,
  TransferStatus,
} from '@/db/schemas/enums';

// Test data generators

export async function createTestCompany(data?: {
  name?: string;
  type?: string;
  code?: string;
  createdBy?: string;
}) {
  const [company] = await db
    .insert(companies)
    .values({
      name: data?.name || `Test Company ${Date.now()}`,
      type: data?.type || 'test',
      code: data?.code || `TEST${Date.now()}`,
      createdBy: data?.createdBy || crypto.randomUUID(),
      isDeleted: false,
    })
    .returning();
  return company;
}

export async function createTestBranch(data: {
  companyId: string;
  name?: string;
  type?: string;
  createdBy?: string;
}) {
  const [branch] = await db
    .insert(branches)
    .values({
      companyId: data.companyId,
      name: data.name || `Test Branch ${Date.now()}`,
      type: data.type || 'test',
      createdBy: data.createdBy || crypto.randomUUID(),
      isDeleted: false,
    })
    .returning();
  return branch;
}

export async function createTestRole(data: {
  companyId: string;
  name?: string;
  createdBy?: string;
}) {
  const [role] = await db
    .insert(roles)
    .values({
      companyId: data.companyId,
      name: data.name || `Test Role ${Date.now()}`,
      createdBy: data.createdBy || crypto.randomUUID(),
      isDeleted: false,
    })
    .returning();
  return role;
}

export async function createTestUser(data: {
  companyId: string;
  branchId: string;
  roleId: string;
  fullname?: string;
  email?: string;
  telephone?: string;
  createdBy?: string;
}) {
  const [user] = await db
    .insert(users)
    .values({
      companyId: data.companyId,
      branchId: data.branchId,
      roleId: data.roleId,
      fullname: data.fullname || `Test User ${Date.now()}`,
      email: data.email || `test${Date.now()}@example.com`,
      telephone: data.telephone || `+233${Math.floor(Math.random() * 1000000000)}`,
      createdBy: data.createdBy || crypto.randomUUID(),
      status: UserStatus.ACTIVE,
    })
    .returning();
  return user;
}

export async function createTestProductCategory(data: {
  companyId: string;
  name?: string;
  description?: string;
  createdBy?: string;
}) {
  const [category] = await db
    .insert(productCategories)
    .values({
      companyId: data.companyId,
      name: data.name || `Test Category ${Date.now()}`,
      description: data.description,
      createdBy: data.createdBy || crypto.randomUUID(),
      isDeleted: false,
    })
    .returning();
  return category;
}

export async function createTestProduct(data: {
  companyId: string;
  categoryId?: string;
  sku?: string;
  name?: string;
  description?: string;
  unitOfMeasure?: number;
  minStockLevel?: bigint;
  createdBy?: string;
}) {
  const [product] = await db
    .insert(products)
    .values({
      companyId: data.companyId,
      categoryId: data.categoryId,
      sku: data.sku || `SKU${Date.now()}`,
      name: data.name || `Test Product ${Date.now()}`,
      description: data.description,
      unitOfMeasure: data.unitOfMeasure ?? UnitOfMeasure.PIECE,
      minStockLevel: data.minStockLevel ?? BigInt(10),
      createdBy: data.createdBy || crypto.randomUUID(),
      isDeleted: false,
    })
    .returning();
  return product;
}

export async function createTestInventoryLocation(data: {
  companyId: string;
  branchId: string;
  name?: string;
  description?: string;
  isDeleted?: boolean;
  createdBy?: string;
}) {
  const [location] = await db
    .insert(inventoryLocations)
    .values({
      companyId: data.companyId,
      branchId: data.branchId,
      name: data.name || `Test Location ${Date.now()}`,
      description: data.description,
      isDeleted: data.isDeleted ?? false,
      createdBy: data.createdBy || crypto.randomUUID(),
    })
    .returning();
  return location;
}

export async function createTestStockLevel(data: {
  companyId: string;
  productId: string;
  locationId: string;
  quantity?: bigint;
}) {
  const [stockLevel] = await db
    .insert(stockLevels)
    .values({
      companyId: data.companyId,
      productId: data.productId,
      locationId: data.locationId,
      quantity: data.quantity ?? BigInt(100),
    })
    .returning();
  return stockLevel;
}

export async function createTestStockMovement(data: {
  companyId: string;
  productId: string;
  locationId: string;
  movementType?: number;
  quantity?: bigint;
  referenceType?: string;
  referenceId?: string;
  notes?: string;
  createdBy?: string;
}) {
  const [movement] = await db
    .insert(stockMovements)
    .values({
      companyId: data.companyId,
      productId: data.productId,
      locationId: data.locationId,
      movementType: data.movementType ?? StockMovementType.RECEIPT,
      quantity: data.quantity ?? BigInt(10),
      referenceType: data.referenceType,
      referenceId: data.referenceId,
      notes: data.notes,
      createdBy: data.createdBy || crypto.randomUUID(),
    })
    .returning();
  return movement;
}

export async function createTestStockAdjustment(data: {
  companyId: string;
  productId: string;
  locationId: string;
  reason?: number;
  quantityChange?: bigint;
  notes?: string;
  createdBy?: string;
}) {
  const [adjustment] = await db
    .insert(stockAdjustments)
    .values({
      companyId: data.companyId,
      productId: data.productId,
      locationId: data.locationId,
      reason: data.reason ?? StockAdjustmentReason.RECOUNT,
      quantityChange: data.quantityChange ?? BigInt(10),
      notes: data.notes,
      createdBy: data.createdBy || crypto.randomUUID(),
    })
    .returning();
  return adjustment;
}

export async function createTestStockTransfer(data: {
  companyId: string;
  productId: string;
  fromLocationId: string;
  toLocationId: string;
  quantity?: bigint;
  status?: number;
  notes?: string;
  createdBy?: string;
}) {
  const [transfer] = await db
    .insert(stockTransfers)
    .values({
      companyId: data.companyId,
      productId: data.productId,
      fromLocationId: data.fromLocationId,
      toLocationId: data.toLocationId,
      quantity: data.quantity ?? BigInt(10),
      status: data.status ?? TransferStatus.PENDING,
      notes: data.notes,
      createdBy: data.createdBy || crypto.randomUUID(),
    })
    .returning();
  return transfer;
}

// Cleanup functions

export async function cleanupTestData() {
  // Delete in reverse order of dependencies
  await db.delete(stockTransfers);
  await db.delete(stockAdjustments);
  await db.delete(stockMovements);
  await db.delete(stockLevels);
  await db.delete(inventoryLocations);
  await db.delete(products);
  await db.delete(productCategories);
  // Note: We don't delete users, branches, roles, companies as they might be used by other tests
}

export async function cleanupTestCompanyData(companyId: string) {
  // Delete data for specific company
  const companyProducts = await db
    .select({ id: products.id })
    .from(products)
    .where(eq(products.companyId, companyId));

  const productIds = companyProducts.map((p) => p.id);

  if (productIds.length > 0) {
    await db.delete(stockMovements).where(inArray(stockMovements.productId, productIds));
    await db.delete(stockLevels).where(inArray(stockLevels.productId, productIds));
  }

  await db.delete(products).where(eq(products.companyId, companyId));
  await db.delete(productCategories).where(eq(productCategories.companyId, companyId));
}
