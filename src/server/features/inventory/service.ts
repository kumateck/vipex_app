import { Conflict, NotFound, BadRequest } from '../../utils/http-error';
import {
  InventoryMaintenanceIssueType,
  InventoryMaintenanceStatus,
  InventoryLocationType,
  StockAllocationStrategy,
  StockLotStatus,
  StockCountSessionStatus,
  InventoryApprovalStatus,
  InventoryValuationMethod,
  InventoryReplenishmentProposalStatus,
  InventoryTaskStatus,
  InventoryEventType,
  StockReservationAllocationStatus,
  StockReservationStatus,
  StockRequestStatus,
  StockMovementType,
  StockAdjustmentReason,
  TransferStatus,
  UnitOfMeasure,
} from '@/db/schemas/enums';
import { db } from '@/db/config';
import {
  inventoryLocations,
  productUnitConversions,
  products,
  procurementGoodsReceiptItems,
  procurementGoodsReceipts,
  procurementPurchaseOrders,
  procurementSuppliers,
  stockLevels,
  stockLots,
  stockLotMovements,
  stockReservationAllocations,
  stockReservations,
  stockMaintenanceRecords,
  stockCountSessions,
  stockCountSessionLines,
  stockMovements,
  stockAdjustments,
  stockTransferAcceptances,
  stockRequestAcknowledgements,
  inventoryApprovalPolicies,
  inventoryApprovalRequests,
  inventoryValuationSnapshots,
  inventoryFinancialPostings,
  inventoryReplenishmentProposals,
  inventoryReplenishmentProposalLines,
  inventoryTasks,
  inventoryTaskScans,
  inventoryEventJournal,
  stockRequestLines,
  stockRequests,
  users,
} from '@/db/schemas';
import { and, asc, desc, eq, gt, gte, inArray, lte, or, sql } from 'drizzle-orm';
import {
  createProductCategoryRepo,
  listProductCategoryOptionsRepo,
  findProductCategoryByNameRepo,
  getProductCategoryRepo,
  listProductCategoriesRepo,
  softDeleteProductCategoryRepo,
  updateProductCategoryRepo,
  type ListProductCategoriesParams,
  listProductOptionsRepo,
  findProductBySkuRepo,
  getProductRepo,
  listProductUnitConversionsByProductIdsRepo,
  listProductUnitConversionsRepo,
  listProductsRepo,
  softDeleteProductRepo,
  type ListProductsParams,
  createInventoryLocationRepo,
  listInventoryLocationOptionsRepo,
  findInventoryLocationByNameRepo,
  getInventoryLocationRepo,
  listInventoryLocationsRepo,
  softDeleteInventoryLocationRepo,
  updateInventoryLocationRepo,
  type ListInventoryLocationsParams,
  getStockLevelRepo,
  getStockLotRepo,
  listStockLevelsRepo,
  listStockLotsRepo,
  listStockLotMovementsRepo,
  upsertStockLevelRepo,
  type ListStockLevelsParams,
  type ListStockLotsParams,
  createStockMovementRepo,
  listStockMovementsRepo,
  type ListStockMovementsParams,
  createStockAdjustmentRepo,
  listStockAdjustmentsRepo,
  type ListStockAdjustmentsParams,
  createStockTransferRepo,
  getStockTransferRepo,
  listStockTransfersRepo,
  updateStockTransferRepo,
  type ListStockTransfersParams,
  getStockRequestLineRepo,
  getStockRequestRepo,
  getStockMaintenanceRecordRepo,
  getInventoryDashboardSummaryRepo,
  getReservationExceptionsSummaryRepo,
  getStockAllocationPolicyRepo,
  getStockReservationByLineRepo,
  getStockReservationRepo,
  getLowStockProductsRepo,
  listStockMaintenanceRecordsRepo,
  listStockReservationAllocationsRepo,
  listStockReservationsRepo,
  listReservedByProductLocationRepo,
  listStockRequestLinesRepo,
  listStockRequestsRepo,
  type ListStockRequestsParams,
  getMovementHistoryRepo,
  type ListStockMaintenanceRecordsParams,
  updateStockRequestRepo,
  updateStockReservationAllocationRepo,
  updateStockReservationRepo,
  updateStockLotRepo,
  upsertStockAllocationPolicyRepo,
  findStockLotByBatchRepo,
  createStockLotRepo,
  createStockLotMovementRepo,
  createStockReservationRepo,
  createStockReservationAllocationsRepo,
  type MovementHistoryParams,
  type ListStockReservationsParams,
} from './repository';
import { sendMail } from '@/server/services/mail/mailer';

function isInventoryLocationType(value: number): value is InventoryLocationType {
  return (
    value >= InventoryLocationType.MAIN_STORE && value <= InventoryLocationType.CONSUMPTION_LOCATION
  );
}

function isInventoryMaintenanceIssueType(value: number): value is InventoryMaintenanceIssueType {
  return (
    value >= InventoryMaintenanceIssueType.MAINTENANCE &&
    value <= InventoryMaintenanceIssueType.MISSING
  );
}

function isStockAllocationStrategy(value: number): value is StockAllocationStrategy {
  return (
    value >= StockAllocationStrategy.FEFO && value <= StockAllocationStrategy.HIGHEST_AVAILABLE
  );
}

function isStockLotStatus(value: number): value is StockLotStatus {
  return value >= StockLotStatus.ACTIVE && value <= StockLotStatus.DEPLETED;
}

type ProductUnitConversionInput = {
  unitOfMeasure: number;
  factorToBase: number;
};

function isUnitOfMeasure(value: number): value is UnitOfMeasure {
  return value >= UnitOfMeasure.PIECE && value <= UnitOfMeasure.DOZEN;
}

function normalizeProductUnitConversions(
  baseUnit: number,
  conversions: ProductUnitConversionInput[] | undefined,
): ProductUnitConversionInput[] {
  if (!isUnitOfMeasure(baseUnit)) {
    throw BadRequest('Invalid base unit of measure');
  }

  const sanitized: ProductUnitConversionInput[] = [];
  const unitSet = new Set<number>([baseUnit]);
  const factorSet = new Set<number>([1]);

  for (const conversion of conversions ?? []) {
    if (!isUnitOfMeasure(conversion.unitOfMeasure)) {
      throw BadRequest('Invalid unit of measure in conversion chain');
    }
    if (!Number.isInteger(conversion.factorToBase) || conversion.factorToBase <= 1) {
      throw BadRequest('Conversion factor must be an integer greater than 1');
    }
    if (conversion.unitOfMeasure === baseUnit) {
      throw BadRequest('Base unit must not be repeated in conversion chain');
    }
    if (unitSet.has(conversion.unitOfMeasure)) {
      throw BadRequest('Duplicate unit detected in conversion chain');
    }
    if (factorSet.has(conversion.factorToBase)) {
      throw BadRequest('Duplicate conversion factor detected in conversion chain');
    }

    unitSet.add(conversion.unitOfMeasure);
    factorSet.add(conversion.factorToBase);
    sanitized.push(conversion);
  }

  const sorted = [...sanitized].sort((a, b) => a.factorToBase - b.factorToBase);
  let previousFactor = 1;
  for (const item of sorted) {
    if (item.factorToBase % previousFactor !== 0) {
      throw BadRequest('Conversion factors must form a divisible chain from base unit');
    }
    previousFactor = item.factorToBase;
  }

  return [{ unitOfMeasure: baseUnit, factorToBase: 1 }, ...sorted];
}

async function appendInventoryEventSvc(input: {
  companyId: string;
  eventType: InventoryEventType;
  entityType: string;
  entityId: string;
  payload: Record<string, unknown>;
  createdBy: string;
}) {
  await db.insert(inventoryEventJournal).values({
    companyId: input.companyId,
    eventType: input.eventType,
    entityType: input.entityType,
    entityId: input.entityId,
    payloadJson: JSON.stringify(input.payload ?? {}),
    createdBy: input.createdBy,
  });
}

// Product Categories
export async function listProductCategoriesSvc(p: ListProductCategoriesParams) {
  return listProductCategoriesRepo(p);
}
export async function listProductCategoryOptionsSvc(p: {
  companyId?: string | null;
  search?: string | null;
}) {
  return listProductCategoryOptionsRepo(p);
}

export async function getProductCategorySvc(id: string) {
  const category = await getProductCategoryRepo(id);
  if (!category) throw NotFound('Product category not found');
  return category;
}

export async function createProductCategorySvc(input: {
  companyId: string;
  name: string;
  description?: string | null;
  createdBy: string;
}) {
  const dup = await findProductCategoryByNameRepo(input.companyId, input.name);
  if (dup) throw Conflict('Product category name already exists for this company');
  const created = await createProductCategoryRepo({ ...input, isDeleted: false });
  return { id: created?.id };
}

export async function updateProductCategorySvc(
  id: string,
  patch: { name?: string; description?: string | null },
) {
  if (patch.name) {
    const existing = await getProductCategoryRepo(id);
    if (!existing) throw NotFound('Product category not found');
    if (patch.name !== existing.name) {
      const dup = await findProductCategoryByNameRepo(existing.companyId, patch.name);
      if (dup && dup.id !== id)
        throw Conflict('Product category name already exists for this company');
    }
  }
  const updated = await updateProductCategoryRepo(id, patch);
  if (!updated) throw NotFound('Product category not found');
  return { id: updated.id };
}

export async function deleteProductCategorySvc(id: string) {
  const count = await softDeleteProductCategoryRepo(id);
  if (!count) throw NotFound('Product category not found or already deleted');
  return { success: true };
}

// Products
export async function listProductsSvc(p: ListProductsParams) {
  const result = await listProductsRepo(p);
  if (!result.data.length) return result;

  const conversions = await listProductUnitConversionsByProductIdsRepo(
    result.data.map((product) => product.id),
  );
  const conversionsByProductId = new Map<
    string,
    { unitOfMeasure: number; factorToBase: number; sortOrder: number }[]
  >();
  for (const row of conversions) {
    const existing = conversionsByProductId.get(row.productId) ?? [];
    existing.push({
      unitOfMeasure: row.unitOfMeasure,
      factorToBase: row.factorToBase,
      sortOrder: row.sortOrder,
    });
    conversionsByProductId.set(row.productId, existing);
  }

  return {
    ...result,
    data: result.data.map((product) => ({
      ...product,
      unitConversions: conversionsByProductId.get(product.id) ?? [
        { unitOfMeasure: product.unitOfMeasure, factorToBase: 1, sortOrder: 0 },
      ],
    })),
  };
}
export async function listProductOptionsSvc(p: {
  companyId?: string | null;
  categoryId?: string | null;
  search?: string | null;
}) {
  return listProductOptionsRepo(p);
}

export async function getProductSvc(id: string) {
  const product = await getProductRepo(id);
  if (!product) throw NotFound('Product not found');
  const conversions = await listProductUnitConversionsRepo(id);
  return {
    ...product,
    unitConversions: conversions.length
      ? conversions
      : [{ unitOfMeasure: product.unitOfMeasure, factorToBase: 1, sortOrder: 0 }],
  };
}

export async function createProductSvc(input: {
  companyId: string;
  categoryId?: string | null;
  sku: string;
  name: string;
  description?: string | null;
  unitOfMeasure: number;
  unitConversions?: ProductUnitConversionInput[];
  isRecoverable?: boolean;
  minStockLevel?: number;
  createdBy: string;
}) {
  const dup = await findProductBySkuRepo(input.companyId, input.sku);
  if (dup) throw Conflict('Product SKU already exists for this company');
  const normalizedConversions = normalizeProductUnitConversions(
    input.unitOfMeasure,
    input.unitConversions,
  );

  const productValues = {
    companyId: input.companyId,
    categoryId: input.categoryId,
    sku: input.sku,
    name: input.name,
    description: input.description,
    unitOfMeasure: input.unitOfMeasure,
    isRecoverable: Boolean(input.isRecoverable),
    minStockLevel: input.minStockLevel,
    createdBy: input.createdBy,
  };
  const created = await db.transaction(async (tx) => {
    const [product] = await tx
      .insert(products)
      .values({ ...productValues, isDeleted: false })
      .returning({ id: products.id });
    if (!product) throw Conflict('Failed to create product');

    await tx.insert(productUnitConversions).values(
      normalizedConversions.map((conversion, index) => ({
        productId: product.id,
        unitOfMeasure: conversion.unitOfMeasure,
        factorToBase: conversion.factorToBase,
        sortOrder: index,
      })),
    );

    return product;
  });
  return { id: created?.id };
}

export async function updateProductSvc(
  id: string,
  patch: {
    categoryId?: string | null;
    name?: string;
    description?: string | null;
    unitOfMeasure?: number;
    unitConversions?: ProductUnitConversionInput[];
    isRecoverable?: boolean;
    minStockLevel?: number;
  },
) {
  const existing = await getProductRepo(id);
  if (!existing) throw NotFound('Product not found');

  const nextBaseUnit = patch.unitOfMeasure ?? existing.unitOfMeasure;
  const shouldReplaceConversions =
    patch.unitConversions !== undefined || patch.unitOfMeasure !== undefined;

  const normalizedConversions = shouldReplaceConversions
    ? normalizeProductUnitConversions(nextBaseUnit, patch.unitConversions)
    : null;

  const productPatch: {
    categoryId?: string | null;
    name?: string;
    description?: string | null;
    unitOfMeasure?: number;
    isRecoverable?: boolean;
    minStockLevel?: number;
  } = { ...patch };
  delete (productPatch as { unitConversions?: ProductUnitConversionInput[] }).unitConversions;
  const updated = await db.transaction(async (tx) => {
    const [row] = await tx
      .update(products)
      .set({ ...productPatch, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning({ id: products.id });

    if (!row) return null;

    if (normalizedConversions) {
      await tx.delete(productUnitConversions).where(eq(productUnitConversions.productId, id));

      await tx.insert(productUnitConversions).values(
        normalizedConversions.map((conversion, index) => ({
          productId: id,
          unitOfMeasure: conversion.unitOfMeasure,
          factorToBase: conversion.factorToBase,
          sortOrder: index,
        })),
      );
    }

    return row;
  });

  if (!updated) throw NotFound('Product not found');
  return { id: updated.id };
}

export async function deleteProductSvc(id: string) {
  const count = await softDeleteProductRepo(id);
  if (!count) throw NotFound('Product not found or already deleted');
  return { success: true };
}

// Inventory Locations
export async function listInventoryLocationsSvc(p: ListInventoryLocationsParams) {
  return listInventoryLocationsRepo(p);
}
export async function listInventoryLocationOptionsSvc(p: {
  companyId?: string | null;
  branchId?: string | null;
  locationType?: number | null;
  parentLocationId?: string | null;
  search?: string | null;
}) {
  return listInventoryLocationOptionsRepo(p);
}

export async function getInventoryLocationSvc(id: string) {
  const location = await getInventoryLocationRepo(id);
  if (!location) throw NotFound('Inventory location not found');
  return location;
}

export async function createInventoryLocationSvc(input: {
  companyId: string;
  branchId: string;
  locationType?: number;
  parentLocationId?: string | null;
  name: string;
  description?: string | null;
  createdBy: string;
}) {
  if (input.locationType !== undefined && !isInventoryLocationType(input.locationType)) {
    throw BadRequest('Invalid inventory location type');
  }
  const dup = await findInventoryLocationByNameRepo(input.branchId, input.name);
  if (dup) throw Conflict('Inventory location name already exists for this branch');
  if (input.parentLocationId) {
    const parentLocation = await getInventoryLocationRepo(input.parentLocationId);
    if (!parentLocation) throw NotFound('Parent inventory location not found');
    if (parentLocation.companyId !== input.companyId)
      throw BadRequest('Parent inventory location must belong to the same company');
  }
  const created = await createInventoryLocationRepo({ ...input, isDeleted: false });
  return { id: created?.id };
}

export async function updateInventoryLocationSvc(
  id: string,
  patch: {
    locationType?: number;
    parentLocationId?: string | null;
    name?: string;
    description?: string | null;
  },
) {
  if (patch.locationType !== undefined && !isInventoryLocationType(patch.locationType)) {
    throw BadRequest('Invalid inventory location type');
  }
  if (patch.parentLocationId === id) {
    throw BadRequest('An inventory location cannot be its own parent');
  }
  if (patch.name) {
    const existing = await getInventoryLocationRepo(id);
    if (!existing) throw NotFound('Inventory location not found');
    if (patch.name !== existing.name) {
      const dup = await findInventoryLocationByNameRepo(existing.branchId, patch.name);
      if (dup && dup.id !== id)
        throw Conflict('Inventory location name already exists for this branch');
    }
  }
  if (patch.parentLocationId) {
    const existing = await getInventoryLocationRepo(id);
    if (!existing) throw NotFound('Inventory location not found');
    const parentLocation = await getInventoryLocationRepo(patch.parentLocationId);
    if (!parentLocation) throw NotFound('Parent inventory location not found');
    if (parentLocation.companyId !== existing.companyId)
      throw BadRequest('Parent inventory location must belong to the same company');
  }
  const updated = await updateInventoryLocationRepo(id, patch);
  if (!updated) throw NotFound('Inventory location not found');
  return { id: updated.id };
}

export async function deleteInventoryLocationSvc(id: string) {
  const count = await softDeleteInventoryLocationRepo(id);
  if (!count) throw NotFound('Inventory location not found or already deleted');
  return { success: true };
}

// Stock Levels
export async function listStockLevelsSvc(p: ListStockLevelsParams) {
  return listStockLevelsRepo(p);
}

export async function getStockLevelSvc(productId: string, locationId: string) {
  const level = await getStockLevelRepo(productId, locationId);
  if (!level) throw NotFound('Stock level not found');
  return level;
}

async function recalcStockLevelFromLotsSvc(input: {
  companyId: string;
  productId: string;
  locationId: string;
}) {
  const [agg] = await db
    .select({
      onHand: sql<number>`coalesce(sum(${stockLots.quantityOnHand}), 0)`,
    })
    .from(stockLots)
    .where(
      and(
        eq(stockLots.companyId, input.companyId),
        eq(stockLots.productId, input.productId),
        eq(stockLots.locationId, input.locationId),
      ),
    );
  const quantity = Math.max(0, Number(agg?.onHand ?? 0));
  await upsertStockLevelRepo({
    companyId: input.companyId,
    productId: input.productId,
    locationId: input.locationId,
    quantity,
  });
  return quantity;
}

async function consumeLotsFefoSvc(input: {
  companyId: string;
  productId: string;
  locationId: string;
  quantity: number;
  actorUserId: string;
  referenceId?: string | null;
  referenceType?: string | null;
  notes?: string | null;
  specificLotId?: string | null;
  releaseReservedQuantity?: number;
}) {
  if (input.quantity <= 0) return 0;
  const now = new Date();
  const lotRows = await db
    .select()
    .from(stockLots)
    .where(
      and(
        eq(stockLots.companyId, input.companyId),
        eq(stockLots.productId, input.productId),
        eq(stockLots.locationId, input.locationId),
        eq(stockLots.status, StockLotStatus.ACTIVE),
        or(sql`${stockLots.expiryDate} is null`, gte(stockLots.expiryDate, now)),
        input.specificLotId ? eq(stockLots.id, input.specificLotId) : sql`true`,
      ),
    )
    .orderBy(
      asc(sql`coalesce(${stockLots.expiryDate}, timestamp '2999-12-31')`),
      asc(stockLots.receivedAt),
      asc(stockLots.id),
    );

  let remaining = input.quantity;
  let releasedRemaining = Math.max(0, Number(input.releaseReservedQuantity ?? 0));
  for (const lot of lotRows) {
    if (remaining <= 0) break;
    const onHand = Number(lot.quantityOnHand ?? 0);
    if (onHand <= 0) continue;
    const consumeQty = Math.min(onHand, remaining);
    const reserved = Number(lot.reservedQuantity ?? 0);
    const releaseQty = Math.min(reserved, releasedRemaining, consumeQty);
    const nextOnHand = Math.max(0, onHand - consumeQty);
    const nextReserved = Math.max(0, reserved - releaseQty);
    await updateStockLotRepo(lot.id, {
      quantityOnHand: nextOnHand,
      reservedQuantity: nextReserved,
      status: nextOnHand <= 0 ? StockLotStatus.DEPLETED : lot.status,
      updatedAt: now,
    });
    await createStockLotMovementRepo({
      companyId: input.companyId,
      lotId: lot.id,
      productId: input.productId,
      locationId: input.locationId,
      movementType: StockMovementType.ISSUE,
      quantity: consumeQty,
      referenceId: input.referenceId ?? null,
      referenceType: input.referenceType ?? null,
      notes: input.notes ?? null,
      createdBy: input.actorUserId,
    });
    remaining -= consumeQty;
    releasedRemaining -= releaseQty;
  }

  if (input.specificLotId && remaining > 0) {
    throw BadRequest('Insufficient quantity in selected lot');
  }
  if (!input.specificLotId && lotRows.length > 0 && remaining > 0) {
    throw BadRequest('Insufficient lot quantity to complete FEFO issue');
  }

  return input.quantity - remaining;
}

async function increaseLotOnHandSvc(input: {
  companyId: string;
  productId: string;
  locationId: string;
  batchNumber: string;
  quantity: number;
  actorUserId: string;
  supplierBatchNumber?: string | null;
  expiryDate?: Date | null;
  manufacturedAt?: Date | null;
  receivedAt?: Date | null;
  referenceId?: string | null;
  referenceType?: string | null;
  notes?: string | null;
}) {
  const existing = await findStockLotByBatchRepo({
    companyId: input.companyId,
    productId: input.productId,
    locationId: input.locationId,
    batchNumber: input.batchNumber,
  });
  const now = new Date();
  let lotId = existing?.id ?? null;
  if (existing) {
    const nextOnHand = Number(existing.quantityOnHand ?? 0) + input.quantity;
    await updateStockLotRepo(existing.id, {
      quantityOnHand: nextOnHand,
      status: StockLotStatus.ACTIVE,
      supplierBatchNumber: input.supplierBatchNumber ?? existing.supplierBatchNumber,
      expiryDate: input.expiryDate ?? existing.expiryDate,
      manufacturedAt: input.manufacturedAt ?? existing.manufacturedAt,
      receivedAt: input.receivedAt ?? existing.receivedAt,
      notes: input.notes ?? existing.notes,
      updatedAt: now,
    });
    lotId = existing.id;
  } else {
    const created = await createStockLotRepo({
      companyId: input.companyId,
      productId: input.productId,
      locationId: input.locationId,
      batchNumber: input.batchNumber.trim(),
      supplierBatchNumber: input.supplierBatchNumber ?? null,
      expiryDate: input.expiryDate ?? null,
      manufacturedAt: input.manufacturedAt ?? null,
      receivedAt: input.receivedAt ?? now,
      quantityOnHand: input.quantity,
      reservedQuantity: 0,
      status: StockLotStatus.ACTIVE,
      notes: input.notes ?? null,
      createdBy: input.actorUserId,
    });
    lotId = created?.id ?? null;
  }

  if (!lotId) throw Conflict('Failed to upsert stock lot');
  await createStockLotMovementRepo({
    companyId: input.companyId,
    lotId,
    productId: input.productId,
    locationId: input.locationId,
    movementType: StockMovementType.RECEIPT,
    quantity: input.quantity,
    referenceId: input.referenceId ?? null,
    referenceType: input.referenceType ?? null,
    notes: input.notes ?? null,
    createdBy: input.actorUserId,
  });
  await recalcStockLevelFromLotsSvc({
    companyId: input.companyId,
    productId: input.productId,
    locationId: input.locationId,
  });
  return lotId;
}

// Stock Lots
export async function listStockLotsSvc(p: ListStockLotsParams) {
  return listStockLotsRepo(p);
}

export async function getStockLotSvc(id: string) {
  const lot = await getStockLotRepo(id);
  if (!lot) throw NotFound('Stock lot not found');
  const movements = await listStockLotMovementsRepo(id);
  return { ...lot, movements };
}

export async function getStockLotTraceabilitySvc(input: { lotId: string }) {
  const lot = await getStockLotRepo(input.lotId);
  if (!lot) throw NotFound('Stock lot not found');
  const movements = await listStockLotMovementsRepo(input.lotId);

  const procurementLinks = await db
    .select({
      goodsReceiptItemId: procurementGoodsReceiptItems.id,
      receivedQuantity: procurementGoodsReceiptItems.receivedQuantity,
      goodsReceiptId: procurementGoodsReceipts.id,
      receiptNo: procurementGoodsReceipts.receiptNo,
      receivedAt: procurementGoodsReceipts.receivedAt,
      purchaseOrderId: procurementPurchaseOrders.id,
      poNo: procurementPurchaseOrders.poNo,
      supplierId: procurementSuppliers.id,
      supplierName: procurementSuppliers.name,
    })
    .from(procurementGoodsReceiptItems)
    .innerJoin(
      procurementGoodsReceipts,
      eq(procurementGoodsReceipts.id, procurementGoodsReceiptItems.goodsReceiptId),
    )
    .leftJoin(
      procurementPurchaseOrders,
      eq(procurementPurchaseOrders.id, procurementGoodsReceipts.purchaseOrderId),
    )
    .leftJoin(
      procurementSuppliers,
      eq(procurementSuppliers.id, procurementPurchaseOrders.supplierId),
    )
    .where(
      or(
        eq(procurementGoodsReceiptItems.lotId, input.lotId),
        and(
          eq(procurementGoodsReceipts.companyId, lot.companyId),
          eq(procurementGoodsReceiptItems.locationId, lot.locationId),
          sql`lower(${procurementGoodsReceiptItems.batchNumber}) = lower(${lot.batchNumber})`,
        ),
      ),
    )
    .orderBy(desc(procurementGoodsReceipts.receivedAt), desc(procurementGoodsReceipts.id));

  return {
    lot,
    movements,
    procurementLinks,
  };
}

export async function createStockLotSvc(input: {
  companyId: string;
  productId: string;
  locationId: string;
  batchNumber: string;
  quantityOnHand: number;
  supplierBatchNumber?: string | null;
  expiryDate?: Date | null;
  manufacturedAt?: Date | null;
  receivedAt?: Date | null;
  notes?: string | null;
  createdBy: string;
}) {
  if (!Number.isInteger(input.quantityOnHand) || input.quantityOnHand <= 0) {
    throw BadRequest('Lot quantity must be a positive integer in base units');
  }
  if (!input.batchNumber.trim()) {
    throw BadRequest('Batch number is required');
  }
  const product = await getProductRepo(input.productId);
  if (!product) throw NotFound('Product not found');
  const location = await getInventoryLocationRepo(input.locationId);
  if (!location) throw NotFound('Inventory location not found');
  if (location.companyId !== input.companyId) {
    throw BadRequest('Location must belong to the same company');
  }

  const lotId = await increaseLotOnHandSvc({
    companyId: input.companyId,
    productId: input.productId,
    locationId: input.locationId,
    batchNumber: input.batchNumber,
    supplierBatchNumber: input.supplierBatchNumber ?? null,
    expiryDate: input.expiryDate ?? null,
    manufacturedAt: input.manufacturedAt ?? null,
    receivedAt: input.receivedAt ?? null,
    quantity: input.quantityOnHand,
    actorUserId: input.createdBy,
    referenceType: 'stock_lot_create',
    notes: input.notes ?? null,
  });
  return { id: lotId };
}

export async function updateStockLotStatusSvc(input: {
  id: string;
  status?: number;
  notes?: string | null;
}) {
  const lot = await getStockLotRepo(input.id);
  if (!lot) throw NotFound('Stock lot not found');
  if (input.status !== undefined && !isStockLotStatus(input.status)) {
    throw BadRequest('Invalid stock lot status');
  }
  const updated = await updateStockLotRepo(input.id, {
    status: input.status ?? lot.status,
    notes: input.notes ?? lot.notes,
  });
  return { id: updated?.id };
}

export async function runStockLotExpirySweepSvc(input: { companyId: string; actorUserId: string }) {
  const now = new Date();
  const expiredRows = await db
    .select({ id: stockLots.id })
    .from(stockLots)
    .where(
      and(
        eq(stockLots.companyId, input.companyId),
        eq(stockLots.status, StockLotStatus.ACTIVE),
        sql`${stockLots.expiryDate} is not null`,
        sql`${stockLots.expiryDate} < ${now}`,
      ),
    );

  for (const row of expiredRows) {
    await updateStockLotRepo(row.id, {
      status: StockLotStatus.EXPIRED,
      notes: 'Auto-marked expired by expiry sweep',
    });
  }

  return { expiredCount: expiredRows.length, sweptAt: now.toISOString() };
}

export async function getStockLotExpiryAlertsSvc(input: {
  companyId: string;
  daysAhead?: number;
  locationId?: string | null;
}) {
  const daysAhead = Math.max(1, Math.min(180, Number(input.daysAhead ?? 30)));
  const now = new Date();
  const cutoff = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);
  const rows = await db
    .select({
      id: stockLots.id,
      productId: stockLots.productId,
      locationId: stockLots.locationId,
      batchNumber: stockLots.batchNumber,
      expiryDate: stockLots.expiryDate,
      quantityOnHand: stockLots.quantityOnHand,
      reservedQuantity: stockLots.reservedQuantity,
      status: stockLots.status,
    })
    .from(stockLots)
    .where(
      and(
        eq(stockLots.companyId, input.companyId),
        input.locationId ? eq(stockLots.locationId, input.locationId) : sql`true`,
        sql`${stockLots.expiryDate} is not null`,
        sql`${stockLots.expiryDate} <= ${cutoff}`,
        gt(stockLots.quantityOnHand, 0),
      ),
    )
    .orderBy(asc(stockLots.expiryDate), asc(stockLots.locationId), asc(stockLots.batchNumber));

  const totals = {
    nearExpiryCount: rows.filter((r) => Number(r.status) === StockLotStatus.ACTIVE).length,
    expiredCount: rows.filter((r) => Number(r.status) === StockLotStatus.EXPIRED).length,
    atRiskQuantity: rows.reduce((sum, r) => sum + Number(r.quantityOnHand ?? 0), 0),
  };

  return { daysAhead, cutoff: cutoff.toISOString(), totals, rows };
}

export async function getStockLotAnalyticsSvc(input: {
  companyId: string;
  daysAhead?: number;
  issueLookbackDays?: number;
  locationId?: string | null;
}) {
  const daysAhead = Math.max(1, Math.min(180, Number(input.daysAhead ?? 30)));
  const issueLookbackDays = Math.max(1, Math.min(365, Number(input.issueLookbackDays ?? 90)));
  const now = new Date();
  const nearExpiryCutoff = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);
  const issueSince = new Date(now.getTime() - issueLookbackDays * 24 * 60 * 60 * 1000);

  const lotRows = await db
    .select({
      id: stockLots.id,
      productId: stockLots.productId,
      locationId: stockLots.locationId,
      batchNumber: stockLots.batchNumber,
      receivedAt: stockLots.receivedAt,
      expiryDate: stockLots.expiryDate,
      quantityOnHand: stockLots.quantityOnHand,
      reservedQuantity: stockLots.reservedQuantity,
      status: stockLots.status,
    })
    .from(stockLots)
    .where(
      and(
        eq(stockLots.companyId, input.companyId),
        input.locationId ? eq(stockLots.locationId, input.locationId) : sql`true`,
        gt(stockLots.quantityOnHand, 0),
      ),
    );

  const bucketTemplate = [
    { key: 'expired', label: 'Expired', from: null as number | null, to: -1 },
    { key: '0_30', label: '0-30 days', from: 0, to: 30 },
    { key: '31_60', label: '31-60 days', from: 31, to: 60 },
    { key: '61_90', label: '61-90 days', from: 61, to: 90 },
    { key: '91_plus', label: '91+ days', from: 91, to: null as number | null },
    {
      key: 'no_expiry',
      label: 'No expiry',
      from: null as number | null,
      to: null as number | null,
    },
  ];
  const bucketMap = new Map(
    bucketTemplate.map((bucket) => [
      bucket.key,
      { bucket: bucket.label, lotCount: 0, quantity: 0 },
    ]),
  );

  let totalOnHand = 0;
  let totalReserved = 0;
  let expiredLots = 0;
  let nearExpiryLots = 0;
  let atRiskQuantity = 0;

  for (const row of lotRows) {
    const qty = Number(row.quantityOnHand ?? 0);
    const reserved = Number(row.reservedQuantity ?? 0);
    totalOnHand += qty;
    totalReserved += reserved;

    if (!row.expiryDate) {
      const bucket = bucketMap.get('no_expiry');
      if (bucket) {
        bucket.lotCount += 1;
        bucket.quantity += qty;
      }
      continue;
    }

    const diffDays = Math.floor(
      (new Date(row.expiryDate).getTime() - now.getTime()) / (24 * 60 * 60 * 1000),
    );
    if (diffDays < 0 || Number(row.status) === StockLotStatus.EXPIRED) {
      expiredLots += 1;
      atRiskQuantity += qty;
      const bucket = bucketMap.get('expired');
      if (bucket) {
        bucket.lotCount += 1;
        bucket.quantity += qty;
      }
      continue;
    }
    if (new Date(row.expiryDate) <= nearExpiryCutoff) {
      nearExpiryLots += 1;
      atRiskQuantity += qty;
    }

    if (diffDays <= 30) {
      const bucket = bucketMap.get('0_30');
      if (bucket) {
        bucket.lotCount += 1;
        bucket.quantity += qty;
      }
    } else if (diffDays <= 60) {
      const bucket = bucketMap.get('31_60');
      if (bucket) {
        bucket.lotCount += 1;
        bucket.quantity += qty;
      }
    } else if (diffDays <= 90) {
      const bucket = bucketMap.get('61_90');
      if (bucket) {
        bucket.lotCount += 1;
        bucket.quantity += qty;
      }
    } else {
      const bucket = bucketMap.get('91_plus');
      if (bucket) {
        bucket.lotCount += 1;
        bucket.quantity += qty;
      }
    }
  }

  const issueRows = await db
    .select({
      id: stockLotMovements.id,
      lotId: stockLotMovements.lotId,
      productId: stockLotMovements.productId,
      locationId: stockLotMovements.locationId,
      quantity: stockLotMovements.quantity,
      createdAt: stockLotMovements.createdAt,
    })
    .from(stockLotMovements)
    .where(
      and(
        eq(stockLotMovements.companyId, input.companyId),
        input.locationId ? eq(stockLotMovements.locationId, input.locationId) : sql`true`,
        inArray(stockLotMovements.movementType, [
          StockMovementType.ISSUE,
          StockMovementType.TRANSFER_OUT,
        ]),
        gte(stockLotMovements.createdAt, issueSince),
      ),
    );

  const lotsById = new Map(lotRows.map((lot) => [lot.id, lot] as const));
  const lotPoolByScope = new Map<string, typeof lotRows>();
  for (const lot of lotRows) {
    const key = `${lot.productId}:${lot.locationId}`;
    const existing = lotPoolByScope.get(key) ?? [];
    existing.push(lot);
    lotPoolByScope.set(key, existing);
  }

  let evaluatedIssues = 0;
  let compliantIssues = 0;
  const nonCompliantIssues: {
    movementId: string;
    lotId: string;
    productId: string;
    locationId: string;
    issuedQuantity: string;
    issuedAt?: string | null;
    issuedLotBatchNumber: string;
    issuedLotExpiryDate?: string | null;
    expectedEarliestExpiryDate?: string | null;
  }[] = [];

  for (const movement of issueRows) {
    const issuedLot = lotsById.get(movement.lotId);
    if (!issuedLot) continue;
    evaluatedIssues += 1;

    const scopeKey = `${movement.productId}:${movement.locationId}`;
    const pool = lotPoolByScope.get(scopeKey) ?? [];
    const candidateLots = pool.filter((lot) => {
      if (!lot.expiryDate) return false;
      if (!lot.receivedAt || !movement.createdAt) return true;
      return new Date(lot.receivedAt) <= new Date(movement.createdAt);
    });
    const earliestExpiryTs = candidateLots.reduce<number | null>((acc, lot) => {
      if (!lot.expiryDate) return acc;
      const ts = new Date(lot.expiryDate).getTime();
      if (acc === null) return ts;
      return ts < acc ? ts : acc;
    }, null);

    const issuedExpiryTs = issuedLot.expiryDate ? new Date(issuedLot.expiryDate).getTime() : null;
    const isCompliant =
      earliestExpiryTs === null || issuedExpiryTs === null || issuedExpiryTs <= earliestExpiryTs;

    if (isCompliant) {
      compliantIssues += 1;
      continue;
    }

    nonCompliantIssues.push({
      movementId: movement.id,
      lotId: movement.lotId,
      productId: movement.productId,
      locationId: movement.locationId,
      issuedQuantity: Number(movement.quantity ?? 0).toString(),
      issuedAt: movement.createdAt?.toISOString?.() ?? movement.createdAt,
      issuedLotBatchNumber: issuedLot.batchNumber,
      issuedLotExpiryDate:
        issuedLot.expiryDate instanceof Date
          ? issuedLot.expiryDate.toISOString()
          : (issuedLot.expiryDate ?? null),
      expectedEarliestExpiryDate: earliestExpiryTs
        ? new Date(earliestExpiryTs).toISOString()
        : null,
    });
  }

  const complianceRatePct =
    evaluatedIssues > 0 ? Math.round((compliantIssues / evaluatedIssues) * 10000) / 100 : 100;

  return {
    daysAhead,
    issueLookbackDays,
    generatedAt: now.toISOString(),
    totals: {
      totalLots: lotRows.length,
      totalOnHand: totalOnHand.toString(),
      totalReserved: totalReserved.toString(),
      expiredLots,
      nearExpiryLots,
      atRiskQuantity: atRiskQuantity.toString(),
    },
    agingBuckets: bucketTemplate.map((bucket) => bucketMap.get(bucket.key)!),
    fefoCompliance: {
      evaluatedIssues,
      compliantIssues,
      nonCompliantIssues: Math.max(0, evaluatedIssues - compliantIssues),
      complianceRatePct,
      items: nonCompliantIssues.slice(0, 100),
    },
  };
}

// Stock Count Sessions (physical count + reconciliation)
function buildStockCountSessionNo() {
  return `SCS-${Date.now().toString(36).toUpperCase()}`;
}

export async function listStockCountSessionsSvc(input: {
  companyId: string;
  limit: number;
  offset: number;
  locationId?: string | null;
  status?: number | null;
}) {
  const where = [
    eq(stockCountSessions.companyId, input.companyId),
    input.locationId ? eq(stockCountSessions.locationId, input.locationId) : sql`true`,
    input.status !== undefined && input.status !== null
      ? eq(stockCountSessions.status, input.status)
      : sql`true`,
  ];
  const [countRow] = await db
    .select({ c: sql<number>`count(*)` })
    .from(stockCountSessions)
    .where(and(...where));
  const rows = await db
    .select()
    .from(stockCountSessions)
    .where(and(...where))
    .orderBy(desc(stockCountSessions.createdAt), desc(stockCountSessions.id))
    .limit(input.limit)
    .offset(input.offset);
  return { data: rows, totalRecords: Number(countRow?.c ?? 0) };
}

export async function getStockCountSessionSvc(id: string) {
  const [session] = await db
    .select()
    .from(stockCountSessions)
    .where(eq(stockCountSessions.id, id))
    .limit(1);
  if (!session) throw NotFound('Stock count session not found');
  const lines = await db
    .select()
    .from(stockCountSessionLines)
    .where(eq(stockCountSessionLines.sessionId, id))
    .orderBy(asc(stockCountSessionLines.createdAt), asc(stockCountSessionLines.id));
  return { ...session, lines };
}

export async function createStockCountSessionSvc(input: {
  companyId: string;
  locationId: string;
  notes?: string | null;
  createdBy: string;
  productIds?: string[];
}) {
  const location = await getInventoryLocationRepo(input.locationId);
  if (!location) throw NotFound('Inventory location not found');
  if (location.companyId !== input.companyId) {
    throw BadRequest('Location must belong to the same company');
  }

  const created = await db.transaction(async (tx) => {
    const [session] = await tx
      .insert(stockCountSessions)
      .values({
        companyId: input.companyId,
        locationId: input.locationId,
        sessionNo: buildStockCountSessionNo(),
        status: StockCountSessionStatus.DRAFT,
        notes: input.notes ?? null,
        createdBy: input.createdBy,
      })
      .returning({ id: stockCountSessions.id });
    if (!session) throw Conflict('Failed to create stock count session');

    const levelRows = await tx
      .select({
        productId: stockLevels.productId,
        quantity: stockLevels.quantity,
      })
      .from(stockLevels)
      .where(
        and(
          eq(stockLevels.companyId, input.companyId),
          eq(stockLevels.locationId, input.locationId),
          input.productIds?.length ? inArray(stockLevels.productId, input.productIds) : sql`true`,
        ),
      );

    if (levelRows.length) {
      await tx.insert(stockCountSessionLines).values(
        levelRows.map((row) => ({
          sessionId: session.id,
          productId: row.productId,
          systemQuantity: Number(row.quantity ?? 0),
          countedQuantity: Number(row.quantity ?? 0),
          varianceQuantity: 0,
        })),
      );
    }

    return session;
  });

  return { id: created.id };
}

export async function updateStockCountSessionLineSvc(input: {
  sessionId: string;
  lineId: string;
  countedQuantity: number;
  varianceReason?: string | null;
  countedBy: string;
}) {
  if (!Number.isInteger(input.countedQuantity) || input.countedQuantity < 0) {
    throw BadRequest('Counted quantity must be a non-negative integer');
  }

  const [session] = await db
    .select()
    .from(stockCountSessions)
    .where(eq(stockCountSessions.id, input.sessionId))
    .limit(1);
  if (!session) throw NotFound('Stock count session not found');
  if (session.status !== StockCountSessionStatus.DRAFT) {
    throw BadRequest('Only draft sessions can be edited');
  }

  const [line] = await db
    .select()
    .from(stockCountSessionLines)
    .where(
      and(
        eq(stockCountSessionLines.id, input.lineId),
        eq(stockCountSessionLines.sessionId, input.sessionId),
      ),
    )
    .limit(1);
  if (!line) throw NotFound('Stock count line not found');

  const variance = input.countedQuantity - Number(line.systemQuantity ?? 0);
  if (variance !== 0 && !(input.varianceReason ?? '').trim()) {
    throw BadRequest(
      'Variance reason is required when counted quantity differs from system quantity',
    );
  }

  await db
    .update(stockCountSessionLines)
    .set({
      countedQuantity: input.countedQuantity,
      varianceQuantity: variance,
      varianceReason: variance !== 0 ? (input.varianceReason?.trim() ?? null) : null,
      countedBy: input.countedBy,
      countedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(stockCountSessionLines.id, input.lineId));

  return { id: input.lineId };
}

export async function submitStockCountSessionSvc(input: { id: string; submittedBy: string }) {
  const [session] = await db
    .select()
    .from(stockCountSessions)
    .where(eq(stockCountSessions.id, input.id))
    .limit(1);
  if (!session) throw NotFound('Stock count session not found');
  if (session.status !== StockCountSessionStatus.DRAFT) {
    throw BadRequest('Only draft sessions can be submitted');
  }
  await db
    .update(stockCountSessions)
    .set({
      status: StockCountSessionStatus.SUBMITTED,
      submittedBy: input.submittedBy,
      submittedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(stockCountSessions.id, input.id));
  return { id: input.id };
}

export async function approveStockCountSessionSvc(input: {
  id: string;
  approvedBy: string;
  applyAdjustments?: boolean;
}) {
  const [session] = await db
    .select()
    .from(stockCountSessions)
    .where(eq(stockCountSessions.id, input.id))
    .limit(1);
  if (!session) throw NotFound('Stock count session not found');
  if (session.status !== StockCountSessionStatus.SUBMITTED) {
    throw BadRequest('Only submitted sessions can be approved');
  }

  const lines = await db
    .select()
    .from(stockCountSessionLines)
    .where(eq(stockCountSessionLines.sessionId, input.id));

  await db.transaction(async (tx) => {
    if (input.applyAdjustments !== false) {
      for (const line of lines) {
        const variance = Number(line.varianceQuantity ?? 0);
        if (variance === 0) continue;
        const [movement] = await tx
          .insert(stockMovements)
          .values({
            companyId: session.companyId,
            productId: line.productId,
            locationId: session.locationId,
            movementType: StockMovementType.ADJUSTMENT,
            quantity: Number(line.countedQuantity ?? 0),
            referenceId: session.id,
            referenceType: 'stock_count_approval',
            notes: line.varianceReason ?? 'Stock count reconciliation adjustment',
            createdBy: input.approvedBy,
          })
          .returning({ id: stockMovements.id });

        await tx
          .insert(stockLevels)
          .values({
            companyId: session.companyId,
            productId: line.productId,
            locationId: session.locationId,
            quantity: Number(line.countedQuantity ?? 0),
          })
          .onConflictDoUpdate({
            target: [stockLevels.productId, stockLevels.locationId],
            set: {
              quantity: Number(line.countedQuantity ?? 0),
              updatedAt: new Date(),
            },
          });

        await tx
          .update(stockCountSessionLines)
          .set({
            adjustmentMovementId: movement?.id ?? null,
            updatedAt: new Date(),
          })
          .where(eq(stockCountSessionLines.id, line.id));
      }
    }

    await tx
      .update(stockCountSessions)
      .set({
        status: StockCountSessionStatus.APPROVED,
        approvedBy: input.approvedBy,
        approvedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(stockCountSessions.id, input.id));
  });

  return { id: input.id };
}

export async function getInventoryMonitoringSummarySvc(input: {
  companyId: string;
  daysAhead?: number;
  issueLookbackDays?: number;
}) {
  const [exceptions, expiry, analytics] = await Promise.all([
    getReservationExceptionsSummaryRepo(input.companyId),
    getStockLotExpiryAlertsSvc({
      companyId: input.companyId,
      daysAhead: input.daysAhead ?? 30,
    }),
    getStockLotAnalyticsSvc({
      companyId: input.companyId,
      daysAhead: input.daysAhead ?? 30,
      issueLookbackDays: input.issueLookbackDays ?? 90,
    }),
  ]);

  const [sessionCounts] = await db
    .select({
      draft: sql<number>`coalesce(sum(case when ${stockCountSessions.status} = ${StockCountSessionStatus.DRAFT} then 1 else 0 end), 0)`,
      submitted: sql<number>`coalesce(sum(case when ${stockCountSessions.status} = ${StockCountSessionStatus.SUBMITTED} then 1 else 0 end), 0)`,
      approved: sql<number>`coalesce(sum(case when ${stockCountSessions.status} = ${StockCountSessionStatus.APPROVED} then 1 else 0 end), 0)`,
    })
    .from(stockCountSessions)
    .where(eq(stockCountSessions.companyId, input.companyId));

  return {
    generatedAt: new Date().toISOString(),
    reservationExceptions: {
      openCount: Number(exceptions.openCount ?? 0),
      shortCount: Number(exceptions.shortCount ?? 0),
      shortQty: Number(exceptions.shortQty ?? 0).toString(),
      pendingQty: Number(exceptions.pendingQty ?? 0).toString(),
    },
    lotRisk: {
      nearExpiryCount: expiry.totals.nearExpiryCount,
      expiredCount: expiry.totals.expiredCount,
      atRiskQuantity: expiry.totals.atRiskQuantity.toString(),
      fefoComplianceRatePct: analytics.fefoCompliance.complianceRatePct,
      fefoNonCompliantIssues: analytics.fefoCompliance.nonCompliantIssues,
    },
    stockCountSessions: {
      draft: Number(sessionCounts?.draft ?? 0),
      submitted: Number(sessionCounts?.submitted ?? 0),
      approved: Number(sessionCounts?.approved ?? 0),
    },
  };
}

export async function sendInventoryNearExpiryAlertsSvc(input: {
  companyId: string;
  actorUserId: string;
  daysAhead?: number;
  recipientEmails?: string[];
}) {
  const alerts = await getStockLotExpiryAlertsSvc({
    companyId: input.companyId,
    daysAhead: input.daysAhead ?? 30,
  });
  if (!alerts.rows.length) {
    return { sent: false, recipients: 0, reason: 'No near-expiry or expired lots found' };
  }

  let recipients = (input.recipientEmails ?? [])
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  if (!recipients.length) {
    const rows = await db
      .select({ email: users.email })
      .from(users)
      .where(and(eq(users.companyId, input.companyId), sql`${users.email} is not null`))
      .limit(20);
    recipients = rows.map((row) => row.email?.trim().toLowerCase() ?? '').filter(Boolean);
  }
  if (!recipients.length) {
    return { sent: false, recipients: 0, reason: 'No recipient emails found' };
  }

  const lines = alerts.rows
    .slice(0, 50)
    .map((row) => {
      const expiry = row.expiryDate ? new Date(row.expiryDate).toISOString().slice(0, 10) : 'N/A';
      return `- Batch ${row.batchNumber} | Product ${row.productId} | Location ${row.locationId} | Expiry ${expiry} | OnHand ${row.quantityOnHand}`;
    })
    .join('\n');

  try {
    await sendMail({
      to: recipients,
      subject: `[Inventory Alert] ${alerts.rows.length} lot(s) near expiry/expired`,
      text:
        `Inventory near-expiry summary\n\n` +
        `Window: ${alerts.daysAhead} days\n` +
        `Near-expiry lots: ${alerts.totals.nearExpiryCount}\n` +
        `Expired lots: ${alerts.totals.expiredCount}\n` +
        `At-risk quantity: ${alerts.totals.atRiskQuantity}\n\n` +
        `Top lots:\n${lines}`,
    });
  } catch (error) {
    return {
      sent: false,
      recipients: recipients.length,
      reason: error instanceof Error ? error.message : 'Email notification failed',
    };
  }

  return { sent: true, recipients: recipients.length, lots: alerts.rows.length };
}

export async function runInventoryDailyAutomationSvc(input: {
  companyId: string;
  actorUserId: string;
  daysAhead?: number;
  sendEmailAlerts?: boolean;
  recipientEmails?: string[];
}) {
  const daysAhead = Math.max(1, Math.min(180, Number(input.daysAhead ?? 30)));
  const sweep = await runStockLotExpirySweepSvc({
    companyId: input.companyId,
    actorUserId: input.actorUserId,
  });
  const alerts = await getStockLotExpiryAlertsSvc({
    companyId: input.companyId,
    daysAhead,
  });
  const notification =
    input.sendEmailAlerts === false
      ? { sent: false, recipients: 0, reason: 'Email alerts disabled' }
      : await sendInventoryNearExpiryAlertsSvc({
          companyId: input.companyId,
          actorUserId: input.actorUserId,
          daysAhead,
          recipientEmails: input.recipientEmails,
        });

  return {
    message: 'Inventory daily automation job executed',
    sweep,
    alerts: {
      nearExpiryCount: alerts.totals.nearExpiryCount,
      expiredCount: alerts.totals.expiredCount,
      atRiskQuantity: alerts.totals.atRiskQuantity.toString(),
    },
    notification,
  };
}

// Stock Movements
export async function listStockMovementsSvc(p: ListStockMovementsParams) {
  return listStockMovementsRepo(p);
}

export async function createStockMovementSvc(input: {
  companyId: string;
  productId: string;
  locationId: string;
  movementType: number;
  quantity: number;
  batchNumber?: string | null;
  sourceLotId?: string | null;
  supplierBatchNumber?: string | null;
  expiryDate?: Date | null;
  manufacturedAt?: Date | null;
  receivedAt?: Date | null;
  referenceId?: string | null;
  referenceType?: string | null;
  notes?: string | null;
  createdBy: string;
}) {
  // Validate product and location exist
  const product = await getProductRepo(input.productId);
  if (!product) throw NotFound('Product not found');
  const location = await getInventoryLocationRepo(input.locationId);
  if (!location) throw NotFound('Inventory location not found');

  // Create movement record
  const created = await createStockMovementRepo({
    ...input,
    lotId: input.sourceLotId ?? null,
  });

  // Update stock level based on movement type
  const currentLevel = await getStockLevelRepo(input.productId, input.locationId);
  let newQuantity = currentLevel?.quantity || 0;

  // Apply quantity changes based on movement type
  switch (input.movementType) {
    case StockMovementType.RECEIPT:
    case StockMovementType.TRANSFER_IN:
      newQuantity += input.quantity;
      break;
    case StockMovementType.ISSUE:
    case StockMovementType.TRANSFER_OUT:
      newQuantity -= input.quantity;
      if (newQuantity < 0) throw BadRequest('Insufficient stock for this operation');
      break;
    case StockMovementType.ADJUSTMENT:
      // For adjustments, quantity can be positive or negative
      newQuantity = input.quantity;
      break;
  }

  if (
    (input.movementType === StockMovementType.RECEIPT ||
      input.movementType === StockMovementType.TRANSFER_IN) &&
    input.batchNumber
  ) {
    await increaseLotOnHandSvc({
      companyId: input.companyId,
      productId: input.productId,
      locationId: input.locationId,
      batchNumber: input.batchNumber,
      supplierBatchNumber: input.supplierBatchNumber ?? null,
      expiryDate: input.expiryDate ?? null,
      manufacturedAt: input.manufacturedAt ?? null,
      receivedAt: input.receivedAt ?? null,
      quantity: input.quantity,
      actorUserId: input.createdBy,
      referenceId: input.referenceId ?? created?.id ?? null,
      referenceType: input.referenceType ?? 'stock_movement',
      notes: input.notes ?? null,
    });
  }

  if (
    input.movementType === StockMovementType.ISSUE ||
    input.movementType === StockMovementType.TRANSFER_OUT
  ) {
    await consumeLotsFefoSvc({
      companyId: input.companyId,
      productId: input.productId,
      locationId: input.locationId,
      quantity: input.quantity,
      actorUserId: input.createdBy,
      specificLotId: input.sourceLotId ?? null,
      referenceId: input.referenceId ?? created?.id ?? null,
      referenceType: input.referenceType ?? 'stock_movement',
      notes: input.notes ?? null,
    });
  }

  // Upsert stock level
  await upsertStockLevelRepo({
    companyId: input.companyId,
    productId: input.productId,
    locationId: input.locationId,
    quantity: newQuantity,
  });

  return { id: created?.id };
}

// Stock Adjustments (with automatic movement recording)
export async function listStockAdjustmentsSvc(p: ListStockAdjustmentsParams) {
  return listStockAdjustmentsRepo(p);
}

export async function createStockAdjustmentSvc(input: {
  companyId: string;
  productId: string;
  locationId: string;
  reason: number;
  quantityChange: number;
  batchNumber?: string | null;
  sourceLotId?: string | null;
  supplierBatchNumber?: string | null;
  expiryDate?: Date | null;
  manufacturedAt?: Date | null;
  notes?: string | null;
  createdBy: string;
}) {
  // Validate product and location exist
  const product = await getProductRepo(input.productId);
  if (!product) throw NotFound('Product not found');
  const location = await getInventoryLocationRepo(input.locationId);
  if (!location) throw NotFound('Inventory location not found');

  // Get current stock level
  const currentLevel = await getStockLevelRepo(input.productId, input.locationId);
  const currentQty = currentLevel?.quantity || 0;
  const newQuantity = currentQty + input.quantityChange;

  if (newQuantity < 0) throw BadRequest('Adjustment would result in negative stock');

  // Create adjustment record
  const created = await createStockAdjustmentRepo(input);

  // Create stock movement
  await createStockMovementRepo({
    companyId: input.companyId,
    productId: input.productId,
    locationId: input.locationId,
    movementType: StockMovementType.ADJUSTMENT,
    lotId: input.sourceLotId ?? null,
    quantity: newQuantity,
    referenceId: created?.id,
    referenceType: 'adjustment',
    notes: input.notes,
    createdBy: input.createdBy,
  });

  if (input.quantityChange > 0 && input.batchNumber) {
    await increaseLotOnHandSvc({
      companyId: input.companyId,
      productId: input.productId,
      locationId: input.locationId,
      batchNumber: input.batchNumber,
      supplierBatchNumber: input.supplierBatchNumber ?? null,
      expiryDate: input.expiryDate ?? null,
      manufacturedAt: input.manufacturedAt ?? null,
      quantity: input.quantityChange,
      actorUserId: input.createdBy,
      referenceId: created?.id ?? null,
      referenceType: 'adjustment',
      notes: input.notes ?? null,
    });
  }

  if (input.quantityChange < 0) {
    await consumeLotsFefoSvc({
      companyId: input.companyId,
      productId: input.productId,
      locationId: input.locationId,
      quantity: Math.abs(input.quantityChange),
      actorUserId: input.createdBy,
      specificLotId: input.sourceLotId ?? null,
      referenceId: created?.id ?? null,
      referenceType: 'adjustment',
      notes: input.notes ?? null,
    });
  }

  // Update stock level
  await upsertStockLevelRepo({
    companyId: input.companyId,
    productId: input.productId,
    locationId: input.locationId,
    quantity: newQuantity,
  });

  return { id: created?.id };
}

// Stock Transfers
export async function listStockTransfersSvc(p: ListStockTransfersParams) {
  return listStockTransfersRepo(p);
}

export async function getStockTransferSvc(id: string) {
  const transfer = await getStockTransferRepo(id);
  if (!transfer) throw NotFound('Stock transfer not found');
  const acceptances = await db
    .select()
    .from(stockTransferAcceptances)
    .where(eq(stockTransferAcceptances.transferId, id))
    .orderBy(desc(stockTransferAcceptances.acknowledgedAt), desc(stockTransferAcceptances.id));
  const totalAccepted = acceptances.reduce(
    (sum, row) => sum + Number(row.acceptedQuantity ?? 0),
    0,
  );
  const totalDamaged = acceptances.reduce((sum, row) => sum + Number(row.damagedQuantity ?? 0), 0);
  const totalMissing = acceptances.reduce((sum, row) => sum + Number(row.missingQuantity ?? 0), 0);
  const netReceived = Math.max(0, totalAccepted - totalDamaged - totalMissing);
  const fulfilled = Number(transfer.fulfilledQuantity ?? 0);

  return {
    ...transfer,
    acceptance: {
      totalAccepted,
      totalDamaged,
      totalMissing,
      netReceived,
      pendingToAcknowledge: Math.max(0, fulfilled - totalAccepted),
      rows: acceptances,
    },
  };
}

export async function createStockTransferSvc(input: {
  companyId: string;
  productId: string;
  fromLocationId: string;
  toLocationId: string;
  quantity: number;
  notes?: string | null;
  createdBy: string;
}) {
  if (input.fromLocationId === input.toLocationId)
    throw BadRequest('Source and destination locations must be different');

  // Validate product and locations exist
  const product = await getProductRepo(input.productId);
  if (!product) throw NotFound('Product not found');
  const fromLocation = await getInventoryLocationRepo(input.fromLocationId);
  if (!fromLocation) throw NotFound('Source location not found');
  const toLocation = await getInventoryLocationRepo(input.toLocationId);
  if (!toLocation) throw NotFound('Destination location not found');

  // Check if sufficient stock exists at source
  const sourceLevel = await getStockLevelRepo(input.productId, input.fromLocationId);
  if (!sourceLevel || sourceLevel.quantity < input.quantity)
    throw BadRequest('Insufficient stock at source location');

  const created = await createStockTransferRepo(input);
  return { id: created?.id };
}

// Legacy contract behavior: allow creating transfer drafts before stock is fulfilled.
export async function createLegacyStockTransferSvc(input: {
  companyId: string;
  productId: string;
  fromLocationId: string;
  toLocationId: string;
  quantity: number;
  notes?: string | null;
  createdBy: string;
}) {
  if (input.fromLocationId === input.toLocationId)
    throw BadRequest('Source and destination locations must be different');
  if (!Number.isInteger(input.quantity) || input.quantity <= 0) {
    throw BadRequest('Transfer quantity must be a positive integer');
  }

  const product = await getProductRepo(input.productId);
  if (!product) throw NotFound('Product not found');
  const fromLocation = await getInventoryLocationRepo(input.fromLocationId);
  if (!fromLocation) throw NotFound('Source location not found');
  const toLocation = await getInventoryLocationRepo(input.toLocationId);
  if (!toLocation) throw NotFound('Destination location not found');

  const created = await createStockTransferRepo(input);
  return { id: created?.id };
}

export async function updateStockTransferSvc(
  id: string,
  patch: { status?: number; fulfillQuantity?: number; completedBy?: string; notes?: string | null },
) {
  const transfer = await getStockTransferRepo(id);
  if (!transfer) throw NotFound('Stock transfer not found');

  if (transfer.status === TransferStatus.CANCELLED) {
    throw BadRequest('Cancelled transfers cannot be fulfilled');
  }
  if (transfer.status === TransferStatus.COMPLETED) {
    throw BadRequest('Completed transfers cannot be modified');
  }

  const requestedQuantity = Number(transfer.quantity);
  const alreadyFulfilled = Number(transfer.fulfilledQuantity ?? 0);
  const remainingQuantity = requestedQuantity - alreadyFulfilled;

  if (!Number.isInteger(requestedQuantity) || requestedQuantity <= 0) {
    throw BadRequest('Transfer quantity must be a positive integer');
  }

  let fulfillQuantity = patch.fulfillQuantity ?? 0;
  if (!Number.isInteger(fulfillQuantity) || fulfillQuantity < 0) {
    throw BadRequest('Fulfillment quantity must be a non-negative integer');
  }
  if (patch.status === undefined && fulfillQuantity === 0) {
    throw BadRequest('Provide a status or fulfillment quantity');
  }

  if (patch.status === TransferStatus.COMPLETED && fulfillQuantity === 0) {
    fulfillQuantity = remainingQuantity;
  }

  if (fulfillQuantity > remainingQuantity) {
    throw BadRequest('Fulfillment quantity exceeds remaining requested quantity');
  }

  if (patch.status === TransferStatus.COMPLETED && fulfillQuantity !== remainingQuantity) {
    throw BadRequest('To mark transfer completed, fulfill all remaining quantity');
  }
  if (patch.status === TransferStatus.CANCELLED && fulfillQuantity > 0) {
    throw BadRequest('Cannot fulfill quantity while cancelling a transfer');
  }

  if (fulfillQuantity > 0) {
    const sourceLevel = await getStockLevelRepo(transfer.productId, transfer.fromLocationId);
    const sourceQuantity = Number(sourceLevel?.quantity ?? 0);
    if (sourceQuantity < fulfillQuantity) {
      throw BadRequest('Insufficient stock at source location for this fulfillment');
    }

    const actor = patch.completedBy || transfer.createdBy;

    await createStockMovementRepo({
      companyId: transfer.companyId,
      productId: transfer.productId,
      locationId: transfer.fromLocationId,
      movementType: StockMovementType.TRANSFER_OUT,
      quantity: fulfillQuantity,
      referenceId: id,
      referenceType: 'transfer',
      notes: transfer.notes,
      createdBy: actor,
    });

    await createStockMovementRepo({
      companyId: transfer.companyId,
      productId: transfer.productId,
      locationId: transfer.toLocationId,
      movementType: StockMovementType.TRANSFER_IN,
      quantity: fulfillQuantity,
      referenceId: id,
      referenceType: 'transfer',
      notes: transfer.notes,
      createdBy: actor,
    });

    // Preserve lot traceability across location transfers using FEFO consumption at source.
    let remainingLotQty = fulfillQuantity;
    const sourceLots = await db
      .select()
      .from(stockLots)
      .where(
        and(
          eq(stockLots.companyId, transfer.companyId),
          eq(stockLots.productId, transfer.productId),
          eq(stockLots.locationId, transfer.fromLocationId),
          eq(stockLots.status, StockLotStatus.ACTIVE),
          or(sql`${stockLots.expiryDate} is null`, gte(stockLots.expiryDate, new Date())),
          gt(stockLots.quantityOnHand, 0),
        ),
      )
      .orderBy(
        asc(sql`coalesce(${stockLots.expiryDate}, timestamp '2999-12-31')`),
        asc(stockLots.receivedAt),
        asc(stockLots.id),
      );

    for (const lot of sourceLots) {
      if (remainingLotQty <= 0) break;
      const onHand = Number(lot.quantityOnHand ?? 0);
      if (onHand <= 0) continue;
      const moveQty = Math.min(onHand, remainingLotQty);
      const nextOnHand = Math.max(0, onHand - moveQty);
      await updateStockLotRepo(lot.id, {
        quantityOnHand: nextOnHand,
        status: nextOnHand <= 0 ? StockLotStatus.DEPLETED : lot.status,
      });
      await createStockLotMovementRepo({
        companyId: transfer.companyId,
        lotId: lot.id,
        productId: transfer.productId,
        locationId: transfer.fromLocationId,
        movementType: StockMovementType.TRANSFER_OUT,
        quantity: moveQty,
        referenceId: id,
        referenceType: 'transfer',
        notes: transfer.notes ?? null,
        createdBy: actor,
      });

      await increaseLotOnHandSvc({
        companyId: transfer.companyId,
        productId: transfer.productId,
        locationId: transfer.toLocationId,
        batchNumber: lot.batchNumber,
        supplierBatchNumber: lot.supplierBatchNumber ?? null,
        expiryDate: lot.expiryDate ?? null,
        manufacturedAt: lot.manufacturedAt ?? null,
        receivedAt: new Date(),
        quantity: moveQty,
        actorUserId: actor,
        referenceId: id,
        referenceType: 'transfer',
        notes: transfer.notes ?? null,
      });
      remainingLotQty -= moveQty;
    }

    await upsertStockLevelRepo({
      companyId: transfer.companyId,
      productId: transfer.productId,
      locationId: transfer.fromLocationId,
      quantity: sourceQuantity - fulfillQuantity,
    });

    const destinationLevel = await getStockLevelRepo(transfer.productId, transfer.toLocationId);
    const destinationQuantity = Number(destinationLevel?.quantity ?? 0);
    await upsertStockLevelRepo({
      companyId: transfer.companyId,
      productId: transfer.productId,
      locationId: transfer.toLocationId,
      quantity: destinationQuantity + fulfillQuantity,
    });
  }

  const nextFulfilled = alreadyFulfilled + fulfillQuantity;
  const nextRemaining = requestedQuantity - nextFulfilled;

  let nextStatus = patch.status ?? transfer.status;
  let completedAt: Date | null | undefined = undefined;
  if (nextRemaining === 0) {
    nextStatus = TransferStatus.COMPLETED;
    completedAt = new Date();
  } else if (nextFulfilled > 0 && nextStatus !== TransferStatus.CANCELLED) {
    nextStatus = TransferStatus.PARTIALLY_FULFILLED;
  } else if (nextStatus === TransferStatus.COMPLETED) {
    nextStatus = TransferStatus.PARTIALLY_FULFILLED;
  } else if (
    nextStatus !== TransferStatus.PENDING &&
    nextStatus !== TransferStatus.IN_TRANSIT &&
    nextStatus !== TransferStatus.CANCELLED
  ) {
    nextStatus = TransferStatus.PENDING;
  }

  if (nextStatus === TransferStatus.CANCELLED && nextFulfilled > 0 && nextRemaining === 0) {
    throw BadRequest('Completed transfers cannot be cancelled');
  }

  const updated = await updateStockTransferRepo(id, {
    status: nextStatus,
    fulfilledQuantity: nextFulfilled,
    notes: patch.notes === undefined ? transfer.notes : patch.notes,
    completedBy: nextStatus === TransferStatus.COMPLETED ? (patch.completedBy ?? null) : null,
    completedAt: nextStatus === TransferStatus.COMPLETED ? completedAt : null,
  });

  return { id: updated?.id };
}

export async function acknowledgeStockTransferReceiptSvc(input: {
  transferId: string;
  acceptedQuantity: number;
  damagedQuantity?: number;
  missingQuantity?: number;
  notes?: string | null;
  acknowledgedBy: string;
}) {
  if (!Number.isInteger(input.acceptedQuantity) || input.acceptedQuantity <= 0) {
    throw BadRequest('Accepted quantity must be a positive integer');
  }
  const damagedQuantity = Number(input.damagedQuantity ?? 0);
  const missingQuantity = Number(input.missingQuantity ?? 0);
  if (!Number.isInteger(damagedQuantity) || damagedQuantity < 0) {
    throw BadRequest('Damaged quantity must be a non-negative integer');
  }
  if (!Number.isInteger(missingQuantity) || missingQuantity < 0) {
    throw BadRequest('Missing quantity must be a non-negative integer');
  }
  if (damagedQuantity + missingQuantity > input.acceptedQuantity) {
    throw BadRequest('Damaged + missing quantity cannot exceed accepted quantity');
  }

  const transfer = await getStockTransferRepo(input.transferId);
  if (!transfer) throw NotFound('Stock transfer not found');

  const acceptedAgg = await db
    .select({ total: sql<number>`coalesce(sum(${stockTransferAcceptances.acceptedQuantity}), 0)` })
    .from(stockTransferAcceptances)
    .where(eq(stockTransferAcceptances.transferId, input.transferId));
  const alreadyAccepted = Number(acceptedAgg[0]?.total ?? 0);
  const fulfilled = Number(transfer.fulfilledQuantity ?? 0);
  const pendingAcknowledge = Math.max(0, fulfilled - alreadyAccepted);
  if (pendingAcknowledge <= 0) {
    throw BadRequest('No fulfilled quantity pending receipt acknowledgement');
  }
  if (input.acceptedQuantity > pendingAcknowledge) {
    throw BadRequest('Accepted quantity exceeds pending receipt acknowledgement quantity');
  }

  const product = await getProductRepo(transfer.productId);
  if (!product) throw NotFound('Product not found');
  const destinationLocation = await getInventoryLocationRepo(transfer.toLocationId);
  if (!destinationLocation) throw NotFound('Destination location not found');

  await db.transaction(async (tx) => {
    await tx.insert(stockTransferAcceptances).values({
      transferId: input.transferId,
      acceptedQuantity: input.acceptedQuantity,
      damagedQuantity,
      missingQuantity,
      notes: input.notes ?? null,
      acknowledgedBy: input.acknowledgedBy,
      acknowledgedAt: new Date(),
    });

    const totalVariance = damagedQuantity + missingQuantity;
    if (totalVariance <= 0) return;

    const destinationLevel = await getStockLevelRepo(transfer.productId, transfer.toLocationId);
    const destinationQty = Number(destinationLevel?.quantity ?? 0);
    if (destinationQty < totalVariance) {
      throw BadRequest('Destination stock is insufficient to record transfer variance');
    }

    let remainingVariance = totalVariance;
    const destinationLots = await tx
      .select()
      .from(stockLots)
      .where(
        and(
          eq(stockLots.companyId, transfer.companyId),
          eq(stockLots.productId, transfer.productId),
          eq(stockLots.locationId, transfer.toLocationId),
          eq(stockLots.status, StockLotStatus.ACTIVE),
          gt(stockLots.quantityOnHand, 0),
        ),
      )
      .orderBy(
        asc(sql`coalesce(${stockLots.expiryDate}, timestamp '2999-12-31')`),
        asc(stockLots.receivedAt),
        asc(stockLots.id),
      );
    for (const lot of destinationLots) {
      if (remainingVariance <= 0) break;
      const onHand = Number(lot.quantityOnHand ?? 0);
      if (onHand <= 0) continue;
      const deductQty = Math.min(onHand, remainingVariance);
      const nextOnHand = Math.max(0, onHand - deductQty);
      await tx
        .update(stockLots)
        .set({
          quantityOnHand: nextOnHand,
          status: nextOnHand <= 0 ? StockLotStatus.DEPLETED : lot.status,
          updatedAt: new Date(),
        })
        .where(eq(stockLots.id, lot.id));
      await tx.insert(stockLotMovements).values({
        companyId: transfer.companyId,
        lotId: lot.id,
        productId: transfer.productId,
        locationId: transfer.toLocationId,
        movementType: StockMovementType.ADJUSTMENT,
        quantity: deductQty,
        referenceId: input.transferId,
        referenceType: 'transfer_receipt_variance',
        notes: input.notes ?? null,
        createdBy: input.acknowledgedBy,
      });
      remainingVariance -= deductQty;
    }
    if (remainingVariance > 0) {
      throw BadRequest('Destination lot stock is insufficient to record transfer variance');
    }

    await tx.insert(stockMovements).values({
      companyId: transfer.companyId,
      productId: transfer.productId,
      locationId: transfer.toLocationId,
      movementType: StockMovementType.ADJUSTMENT,
      quantity: -totalVariance,
      referenceId: input.transferId,
      referenceType: 'transfer_receipt_variance',
      notes: input.notes ?? null,
      createdBy: input.acknowledgedBy,
    });

    await tx.insert(stockAdjustments).values({
      companyId: transfer.companyId,
      productId: transfer.productId,
      locationId: transfer.toLocationId,
      reason:
        missingQuantity > 0 && damagedQuantity > 0
          ? StockAdjustmentReason.OTHER
          : missingQuantity > 0
            ? StockAdjustmentReason.LOSS
            : StockAdjustmentReason.DAMAGE,
      quantityChange: -totalVariance,
      notes: input.notes ?? null,
      createdBy: input.acknowledgedBy,
    });

    await tx
      .insert(stockLevels)
      .values({
        companyId: transfer.companyId,
        productId: transfer.productId,
        locationId: transfer.toLocationId,
        quantity: destinationQty - totalVariance,
      })
      .onConflictDoUpdate({
        target: [stockLevels.productId, stockLevels.locationId],
        set: { quantity: destinationQty - totalVariance, updatedAt: new Date() },
      });
  });

  const acceptedAfterAgg = await db
    .select({
      totalAccepted: sql<number>`coalesce(sum(${stockTransferAcceptances.acceptedQuantity}), 0)`,
      totalDamaged: sql<number>`coalesce(sum(${stockTransferAcceptances.damagedQuantity}), 0)`,
      totalMissing: sql<number>`coalesce(sum(${stockTransferAcceptances.missingQuantity}), 0)`,
    })
    .from(stockTransferAcceptances)
    .where(eq(stockTransferAcceptances.transferId, input.transferId));
  const totals = acceptedAfterAgg[0] ?? { totalAccepted: 0, totalDamaged: 0, totalMissing: 0 };
  const netReceived = Math.max(
    0,
    Number(totals.totalAccepted) - Number(totals.totalDamaged) - Number(totals.totalMissing),
  );

  return {
    id: input.transferId,
    acceptedQuantity: Number(totals.totalAccepted ?? 0),
    damagedQuantity: Number(totals.totalDamaged ?? 0),
    missingQuantity: Number(totals.totalMissing ?? 0),
    netReceived,
    pendingToAcknowledge: Math.max(0, fulfilled - Number(totals.totalAccepted ?? 0)),
    product: { id: product.id, name: product.name },
    destinationLocation: { id: destinationLocation.id, name: destinationLocation.name },
  };
}

// Allocation Policies + Reservations
export async function getStockAllocationPolicySvc(input: {
  companyId: string;
  requesterRootLocationId?: string | null;
}) {
  const policy = await getStockAllocationPolicyRepo(
    input.companyId,
    input.requesterRootLocationId ?? null,
  );
  if (policy) return policy;
  return {
    id: 'default',
    companyId: input.companyId,
    requesterRootLocationId: null,
    strategy: StockAllocationStrategy.FEFO,
    allowPartial: true,
    prioritizeSameBranch: true,
    maxSourceLocations: 3,
    active: true,
    createdBy: 'system',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export async function upsertStockAllocationPolicySvc(input: {
  companyId: string;
  requesterRootLocationId?: string | null;
  strategy: number;
  allowPartial?: boolean;
  prioritizeSameBranch?: boolean;
  maxSourceLocations?: number;
  active?: boolean;
  createdBy: string;
}) {
  if (!isStockAllocationStrategy(input.strategy)) {
    throw BadRequest('Invalid stock allocation strategy');
  }
  const maxSourceLocations = Math.max(1, Math.min(10, Number(input.maxSourceLocations ?? 3)));
  const row = await upsertStockAllocationPolicyRepo({
    companyId: input.companyId,
    requesterRootLocationId: input.requesterRootLocationId ?? null,
    strategy: input.strategy,
    allowPartial: input.allowPartial ?? true,
    prioritizeSameBranch: input.prioritizeSameBranch ?? true,
    maxSourceLocations,
    active: input.active ?? true,
    createdBy: input.createdBy,
  });
  return { id: row?.id };
}

async function ensureStockReservationForRequestLineSvc(input: {
  requestId: string;
  lineId: string;
  createdBy: string;
}) {
  const existing = await getStockReservationByLineRepo(input.lineId);
  if (existing) return existing;
  const request = await getStockRequestRepo(input.requestId);
  if (!request) throw NotFound('Stock request not found');
  const line = await getStockRequestLineRepo(input.lineId);
  if (!line || line.requestId !== request.id) throw NotFound('Stock request line not found');
  const created = await createStockReservationRepo({
    companyId: request.companyId,
    requestId: request.id,
    requestLineId: line.id,
    productId: line.productId,
    requesterLocationId: request.requesterLocationId,
    status: StockReservationStatus.OPEN,
    requestedQuantity: Number(line.requestedQuantity),
    reservedQuantity: 0,
    issuedQuantity: Number(line.fulfilledQuantity ?? 0),
    shortQuantity: 0,
    notes: request.notes ?? null,
    createdBy: input.createdBy,
  });
  if (!created) throw Conflict('Failed to create stock reservation');
  const row = await getStockReservationRepo(created.id);
  if (!row) throw Conflict('Failed to load created stock reservation');
  return row;
}

export async function listStockReservationsSvc(p: ListStockReservationsParams) {
  return listStockReservationsRepo(p);
}

export async function syncStockReservationsForRequestSvc(input: {
  requestId: string;
  actorUserId: string;
}) {
  const request = await getStockRequestRepo(input.requestId);
  if (!request) throw NotFound('Stock request not found');
  const lines = await listStockRequestLinesRepo(input.requestId);
  let created = 0;
  for (const line of lines) {
    const existing = await getStockReservationByLineRepo(line.id);
    if (existing) continue;
    await ensureStockReservationForRequestLineSvc({
      requestId: input.requestId,
      lineId: line.id,
      createdBy: input.actorUserId,
    });
    created += 1;
  }
  return { requestId: input.requestId, created };
}

export async function getStockReservationSvc(id: string) {
  const reservation = await getStockReservationRepo(id);
  if (!reservation) throw NotFound('Stock reservation not found');
  const allocations = await listStockReservationAllocationsRepo(id);
  return { ...reservation, allocations };
}

export async function allocateStockReservationSvc(input: {
  reservationId: string;
  actorUserId: string;
}) {
  const reservation = await getStockReservationRepo(input.reservationId);
  if (!reservation) throw NotFound('Stock reservation not found');
  if (
    reservation.status === StockReservationStatus.CANCELLED ||
    reservation.status === StockReservationStatus.ISSUED
  ) {
    throw BadRequest('Reservation cannot be allocated in current state');
  }

  const request = await getStockRequestRepo(reservation.requestId);
  if (!request) throw NotFound('Stock request not found');
  const requesterLocation = await getInventoryLocationRepo(request.requesterLocationId);
  if (!requesterLocation) throw NotFound('Requester location not found');

  const policy = await getStockAllocationPolicySvc({
    companyId: reservation.companyId,
    requesterRootLocationId: request.requestedToLocationId ?? null,
  });

  const remainingNeed = Math.max(
    0,
    Number(reservation.requestedQuantity) - Number(reservation.issuedQuantity),
  );
  if (remainingNeed <= 0) {
    await updateStockReservationRepo(reservation.id, {
      status: StockReservationStatus.ISSUED,
      reservedQuantity: 0,
      shortQuantity: 0,
    });
    return { id: reservation.id, allocatedQuantity: 0, shortQuantity: 0, allocations: [] };
  }

  const existingAllocations = await listStockReservationAllocationsRepo(reservation.id);
  await db.transaction(async (tx) => {
    for (const allocation of existingAllocations) {
      if (allocation.status !== StockReservationAllocationStatus.RESERVED) continue;
      const releaseQty = Math.max(
        0,
        Number(allocation.reservedQuantity) - Number(allocation.issuedQuantity),
      );
      if (allocation.sourceLotId && releaseQty > 0) {
        await tx
          .update(stockLots)
          .set({
            reservedQuantity: sql`greatest(${stockLots.reservedQuantity} - ${releaseQty}, 0)`,
            updatedAt: new Date(),
          })
          .where(eq(stockLots.id, allocation.sourceLotId));
      }
    }
    await tx
      .update(stockReservationAllocations)
      .set({ status: StockReservationAllocationStatus.RELEASED, updatedAt: new Date() })
      .where(
        and(
          eq(stockReservationAllocations.reservationId, reservation.id),
          eq(stockReservationAllocations.status, StockReservationAllocationStatus.RESERVED),
        ),
      );
  });

  const lotCandidatesRaw = await db
    .select({
      lotId: stockLots.id,
      locationId: stockLots.locationId,
      quantityOnHand: stockLots.quantityOnHand,
      reservedQuantity: stockLots.reservedQuantity,
      expiryDate: stockLots.expiryDate,
      receivedAt: stockLots.receivedAt,
      locationBranchId: inventoryLocations.branchId,
    })
    .from(stockLots)
    .innerJoin(inventoryLocations, eq(inventoryLocations.id, stockLots.locationId))
    .where(
      and(
        eq(stockLots.companyId, reservation.companyId),
        eq(stockLots.productId, reservation.productId),
        eq(stockLots.status, StockLotStatus.ACTIVE),
        or(sql`${stockLots.expiryDate} is null`, gte(stockLots.expiryDate, new Date())),
        gt(stockLots.quantityOnHand, 0),
        eq(inventoryLocations.isDeleted, false),
      ),
    );

  const lotCandidates = lotCandidatesRaw
    .map((row) => ({
      lotId: row.lotId,
      locationId: row.locationId,
      locationBranchId: row.locationBranchId,
      expiryDate: row.expiryDate,
      receivedAt: row.receivedAt,
      available: Math.max(0, Number(row.quantityOnHand ?? 0) - Number(row.reservedQuantity ?? 0)),
    }))
    .filter((row) => row.available > 0 && row.locationId !== request.requesterLocationId);

  const strategy = policy.strategy as number;
  lotCandidates.sort((a, b) => {
    const sameBranchA = a.locationBranchId === requesterLocation.branchId ? 1 : 0;
    const sameBranchB = b.locationBranchId === requesterLocation.branchId ? 1 : 0;
    if (policy.prioritizeSameBranch && sameBranchA !== sameBranchB)
      return sameBranchB - sameBranchA;
    if (strategy === StockAllocationStrategy.HIGHEST_AVAILABLE) return b.available - a.available;

    const aExpiry = a.expiryDate ? new Date(a.expiryDate).getTime() : Number.MAX_SAFE_INTEGER;
    const bExpiry = b.expiryDate ? new Date(b.expiryDate).getTime() : Number.MAX_SAFE_INTEGER;
    if (aExpiry !== bExpiry) return aExpiry - bExpiry;

    const aReceived = a.receivedAt ? new Date(a.receivedAt).getTime() : Number.MAX_SAFE_INTEGER;
    const bReceived = b.receivedAt ? new Date(b.receivedAt).getTime() : Number.MAX_SAFE_INTEGER;
    if (aReceived !== bReceived) return aReceived - bReceived;

    return b.available - a.available;
  });

  let remaining = remainingNeed;
  let seq = 1;
  const allocations: {
    sourceLocationId: string;
    sourceLotId?: string | null;
    reservedQuantity: number;
    sequenceNo: number;
  }[] = [];
  const maxSources = Number(policy.maxSourceLocations ?? 3);
  const usedSourceLocations = new Set<string>();
  for (const candidate of lotCandidates) {
    if (remaining <= 0) break;
    const isNewSource = !usedSourceLocations.has(candidate.locationId);
    if (isNewSource && usedSourceLocations.size >= maxSources) continue;
    const pickQty = Math.min(candidate.available, remaining);
    if (pickQty <= 0) continue;
    usedSourceLocations.add(candidate.locationId);
    allocations.push({
      sourceLocationId: candidate.locationId,
      sourceLotId: candidate.lotId,
      reservedQuantity: pickQty,
      sequenceNo: seq,
    });
    seq += 1;
    remaining -= pickQty;
  }

  if (remaining > 0) {
    const candidatesRaw = await db
      .select({
        locationId: stockLevels.locationId,
        quantity: stockLevels.quantity,
        locationBranchId: inventoryLocations.branchId,
        oldestReceiptAt: sql<Date | null>`min(${stockMovements.createdAt})`,
      })
      .from(stockLevels)
      .innerJoin(inventoryLocations, eq(inventoryLocations.id, stockLevels.locationId))
      .leftJoin(
        stockMovements,
        and(
          eq(stockMovements.companyId, reservation.companyId),
          eq(stockMovements.productId, reservation.productId),
          eq(stockMovements.locationId, stockLevels.locationId),
          inArray(stockMovements.movementType, [
            StockMovementType.RECEIPT,
            StockMovementType.TRANSFER_IN,
          ]),
        ),
      )
      .where(
        and(
          eq(stockLevels.companyId, reservation.companyId),
          eq(stockLevels.productId, reservation.productId),
          gt(stockLevels.quantity, 0),
          eq(inventoryLocations.isDeleted, false),
        ),
      )
      .groupBy(stockLevels.locationId, stockLevels.quantity, inventoryLocations.branchId);
    const reservedByLocRows = await listReservedByProductLocationRepo(
      reservation.companyId,
      reservation.productId,
      candidatesRaw.map((row) => row.locationId),
    );
    const reservedByLoc = new Map(
      reservedByLocRows.map((row) => [row.sourceLocationId, Number(row.reservedQuantity)]),
    );
    const candidates = candidatesRaw
      .map((row) => ({
        locationId: row.locationId,
        available: Math.max(
          0,
          Number(row.quantity ?? 0) - Number(reservedByLoc.get(row.locationId) ?? 0),
        ),
        oldestReceiptAt: row.oldestReceiptAt,
        locationBranchId: row.locationBranchId,
      }))
      .filter((row) => row.available > 0 && row.locationId !== request.requesterLocationId);
    candidates.sort((a, b) => {
      const sameBranchA = a.locationBranchId === requesterLocation.branchId ? 1 : 0;
      const sameBranchB = b.locationBranchId === requesterLocation.branchId ? 1 : 0;
      if (policy.prioritizeSameBranch && sameBranchA !== sameBranchB)
        return sameBranchB - sameBranchA;
      if (strategy === StockAllocationStrategy.HIGHEST_AVAILABLE) return b.available - a.available;
      const aTs = a.oldestReceiptAt
        ? new Date(a.oldestReceiptAt).getTime()
        : Number.MAX_SAFE_INTEGER;
      const bTs = b.oldestReceiptAt
        ? new Date(b.oldestReceiptAt).getTime()
        : Number.MAX_SAFE_INTEGER;
      if (aTs !== bTs) return aTs - bTs;
      return b.available - a.available;
    });
    for (const candidate of candidates) {
      if (remaining <= 0) break;
      const isNewSource = !usedSourceLocations.has(candidate.locationId);
      if (isNewSource && usedSourceLocations.size >= maxSources) continue;
      if (isNewSource) usedSourceLocations.add(candidate.locationId);
      const pickQty = Math.min(candidate.available, remaining);
      if (pickQty <= 0) continue;
      allocations.push({
        sourceLocationId: candidate.locationId,
        sourceLotId: null,
        reservedQuantity: pickQty,
        sequenceNo: seq,
      });
      seq += 1;
      remaining -= pickQty;
    }
  }

  const allocatedQty = allocations.reduce((sum, row) => sum + row.reservedQuantity, 0);
  const shortQty = Math.max(0, remainingNeed - allocatedQty);

  if (shortQty > 0 && !policy.allowPartial) {
    await updateStockReservationRepo(reservation.id, {
      status: StockReservationStatus.SHORT,
      reservedQuantity: 0,
      shortQuantity: remainingNeed,
    });
    return {
      id: reservation.id,
      allocatedQuantity: 0,
      shortQuantity: remainingNeed,
      allocations: [],
    };
  }

  await createStockReservationAllocationsRepo(
    allocations.map((row) => ({
      reservationId: reservation.id,
      sourceLocationId: row.sourceLocationId,
      sourceLotId: row.sourceLotId ?? null,
      sequenceNo: row.sequenceNo,
      reservedQuantity: row.reservedQuantity,
      issuedQuantity: 0,
      status: StockReservationAllocationStatus.RESERVED,
    })),
  );

  for (const row of allocations) {
    if (!row.sourceLotId) continue;
    await db
      .update(stockLots)
      .set({
        reservedQuantity: sql`${stockLots.reservedQuantity} + ${row.reservedQuantity}`,
        updatedAt: new Date(),
      })
      .where(eq(stockLots.id, row.sourceLotId));
  }

  const nextStatus =
    shortQty > 0
      ? StockReservationStatus.PARTIALLY_ALLOCATED
      : allocatedQty > 0
        ? StockReservationStatus.ALLOCATED
        : StockReservationStatus.SHORT;
  await updateStockReservationRepo(reservation.id, {
    reservedQuantity: allocatedQty,
    shortQuantity: shortQty,
    status: nextStatus,
    notes: `Allocated by ${input.actorUserId}`,
  });

  return {
    id: reservation.id,
    allocatedQuantity: allocatedQty,
    shortQuantity: shortQty,
    allocations,
  };
}

export async function issueStockReservationSvc(input: {
  reservationId: string;
  actorUserId: string;
  notes?: string | null;
}) {
  const reservation = await getStockReservationRepo(input.reservationId);
  if (!reservation) throw NotFound('Stock reservation not found');
  const allocations = await listStockReservationAllocationsRepo(reservation.id);
  const openAllocations = allocations.filter(
    (row) => row.status === StockReservationAllocationStatus.RESERVED,
  );
  if (!openAllocations.length) {
    throw BadRequest('No reserved allocations available to issue');
  }

  for (const allocation of openAllocations) {
    const remaining = Math.max(
      0,
      Number(allocation.reservedQuantity) - Number(allocation.issuedQuantity),
    );
    if (remaining <= 0) continue;
    await fulfillStockRequestLineSvc({
      requestId: reservation.requestId,
      lineId: reservation.requestLineId,
      fromLocationId: allocation.sourceLocationId,
      sourceLotId: allocation.sourceLotId ?? null,
      fulfillQuantity: remaining,
      fulfilledBy: input.actorUserId,
      notes: input.notes ?? reservation.notes ?? null,
    });
    await updateStockReservationAllocationRepo(allocation.id, {
      issuedQuantity: Number(allocation.issuedQuantity) + remaining,
      status: StockReservationAllocationStatus.ISSUED,
    });
  }

  const line = await getStockRequestLineRepo(reservation.requestLineId);
  const issuedQty = Number(line?.fulfilledQuantity ?? reservation.issuedQuantity);
  const requestedQty = Number(reservation.requestedQuantity);
  const remainingReq = Math.max(0, requestedQty - issuedQty);
  await updateStockReservationRepo(reservation.id, {
    issuedQuantity: issuedQty,
    reservedQuantity: 0,
    shortQuantity: remainingReq,
    status: remainingReq === 0 ? StockReservationStatus.ISSUED : StockReservationStatus.SHORT,
  });

  return {
    id: reservation.id,
    issuedQuantity: issuedQty,
    remainingQuantity: remainingReq,
  };
}

export async function retryOpenStockReservationsForProductSvc(input: {
  companyId: string;
  productId: string;
  actorUserId: string;
  maxReservations?: number;
}) {
  const limit = Math.max(1, Math.min(200, Number(input.maxReservations ?? 100)));
  const candidates = await db
    .select({
      id: stockReservations.id,
      status: stockReservations.status,
      requestedQuantity: stockReservations.requestedQuantity,
      issuedQuantity: stockReservations.issuedQuantity,
    })
    .from(stockReservations)
    .where(
      and(
        eq(stockReservations.companyId, input.companyId),
        eq(stockReservations.productId, input.productId),
        inArray(stockReservations.status, [
          StockReservationStatus.OPEN,
          StockReservationStatus.PARTIALLY_ALLOCATED,
          StockReservationStatus.SHORT,
        ]),
      ),
    )
    .orderBy(asc(stockReservations.createdAt), asc(stockReservations.id))
    .limit(limit);

  let retried = 0;
  let allocated = 0;
  let stillShort = 0;
  const failed: { reservationId: string; message: string }[] = [];

  for (const row of candidates) {
    retried += 1;
    try {
      const result = await allocateStockReservationSvc({
        reservationId: row.id,
        actorUserId: input.actorUserId,
      });
      if (Number(result.shortQuantity ?? 0) > 0) stillShort += 1;
      else if (Number(result.allocatedQuantity ?? 0) > 0) allocated += 1;
    } catch (error) {
      failed.push({
        reservationId: row.id,
        message: error instanceof Error ? error.message : 'Allocation failed',
      });
    }
  }

  return {
    productId: input.productId,
    retried,
    allocated,
    stillShort,
    failedCount: failed.length,
    failures: failed,
  };
}

async function syncReservationIssueProgressSvc(input: {
  lineId: string;
  fromLocationId: string;
  fulfilledQuantity: number;
}) {
  const reservation = await getStockReservationByLineRepo(input.lineId);
  if (!reservation) return;

  const allocations = await listStockReservationAllocationsRepo(reservation.id);
  let remainingToApply = input.fulfilledQuantity;
  for (const allocation of allocations) {
    if (allocation.sourceLocationId !== input.fromLocationId) continue;
    const allocRemaining = Number(allocation.reservedQuantity) - Number(allocation.issuedQuantity);
    if (allocRemaining <= 0) continue;
    const applyQty = Math.min(allocRemaining, remainingToApply);
    if (applyQty <= 0) continue;
    const nextIssued = Number(allocation.issuedQuantity) + applyQty;
    await updateStockReservationAllocationRepo(allocation.id, {
      issuedQuantity: nextIssued,
      status:
        nextIssued >= Number(allocation.reservedQuantity)
          ? StockReservationAllocationStatus.ISSUED
          : StockReservationAllocationStatus.RESERVED,
    });
    remainingToApply -= applyQty;
    if (remainingToApply <= 0) break;
  }

  const line = await getStockRequestLineRepo(input.lineId);
  const requestedQty = Number(line?.requestedQuantity ?? reservation.requestedQuantity);
  const issuedQty = Number(line?.fulfilledQuantity ?? reservation.issuedQuantity);
  const refreshedAllocations = await listStockReservationAllocationsRepo(reservation.id);
  const openReserved = refreshedAllocations.reduce((sum, row) => {
    if (row.status !== StockReservationAllocationStatus.RESERVED) return sum;
    return sum + Math.max(0, Number(row.reservedQuantity) - Number(row.issuedQuantity));
  }, 0);
  const shortQty = Math.max(0, requestedQty - issuedQty - openReserved);

  const status =
    issuedQty >= requestedQty
      ? StockReservationStatus.ISSUED
      : openReserved > 0
        ? StockReservationStatus.PARTIALLY_ALLOCATED
        : shortQty > 0
          ? StockReservationStatus.SHORT
          : StockReservationStatus.OPEN;

  await updateStockReservationRepo(reservation.id, {
    issuedQuantity: issuedQty,
    reservedQuantity: openReserved,
    shortQuantity: shortQty,
    status,
  });
}

export async function getStockReservationExceptionsSummarySvc(companyId: string) {
  return getReservationExceptionsSummaryRepo(companyId);
}

// Stock Requests
export async function listStockRequestsSvc(p: ListStockRequestsParams) {
  return listStockRequestsRepo(p);
}

export async function getStockRequestSvc(id: string) {
  const request = await getStockRequestRepo(id);
  if (!request) throw NotFound('Stock request not found');
  const lines = await listStockRequestLinesRepo(id);
  const lineIds = lines.map((line) => line.id);
  const acknowledgements = lineIds.length
    ? await db
        .select()
        .from(stockRequestAcknowledgements)
        .where(eq(stockRequestAcknowledgements.requestId, id))
        .orderBy(
          desc(stockRequestAcknowledgements.acknowledgedAt),
          desc(stockRequestAcknowledgements.id),
        )
    : [];

  const ackByLineId = new Map<
    string,
    {
      acknowledgedQuantity: number;
      rows: typeof acknowledgements;
    }
  >();
  for (const row of acknowledgements) {
    const existing = ackByLineId.get(row.requestLineId) ?? { acknowledgedQuantity: 0, rows: [] };
    existing.acknowledgedQuantity += Number(row.acknowledgedQuantity ?? 0);
    existing.rows.push(row);
    ackByLineId.set(row.requestLineId, existing);
  }

  return {
    ...request,
    lines: lines.map((line) => {
      const ack = ackByLineId.get(line.id);
      const fulfilled = Number(line.fulfilledQuantity ?? 0);
      const acknowledged = Number(ack?.acknowledgedQuantity ?? 0);
      return {
        ...line,
        acknowledgedQuantity: acknowledged,
        pendingAcknowledgementQuantity: Math.max(0, fulfilled - acknowledged),
        acknowledgements: ack?.rows ?? [],
      };
    }),
  };
}

export async function createStockRequestSvc(input: {
  companyId: string;
  requesterLocationId: string;
  requestedToLocationId?: string | null;
  notes?: string | null;
  requestedBy: string;
  lines: { productId: string; requestedQuantity: number; notes?: string | null }[];
  submit?: boolean;
}) {
  if (!input.lines.length) throw BadRequest('At least one request line is required');

  const requesterLocation = await getInventoryLocationRepo(input.requesterLocationId);
  if (!requesterLocation) throw NotFound('Requester location not found');
  if (requesterLocation.companyId !== input.companyId)
    throw BadRequest('Requester location must belong to the same company');

  if (input.requestedToLocationId) {
    const requestedTo = await getInventoryLocationRepo(input.requestedToLocationId);
    if (!requestedTo) throw NotFound('Requested-to location not found');
    if (requestedTo.companyId !== input.companyId)
      throw BadRequest('Requested-to location must belong to the same company');
  }

  const seenProducts = new Set<string>();
  for (const line of input.lines) {
    if (!line.productId) throw BadRequest('Product is required for each request line');
    if (!Number.isInteger(line.requestedQuantity) || line.requestedQuantity <= 0) {
      throw BadRequest('Requested quantity must be a positive integer in base units');
    }
    if (seenProducts.has(line.productId)) {
      throw BadRequest('Duplicate product line detected in request');
    }
    seenProducts.add(line.productId);
    const product = await getProductRepo(line.productId);
    if (!product) throw NotFound('One or more products were not found');
  }

  const status = input.submit ? StockRequestStatus.SUBMITTED : StockRequestStatus.DRAFT;
  const created = await db.transaction(async (tx) => {
    const [request] = await tx
      .insert(stockRequests)
      .values({
        companyId: input.companyId,
        requesterLocationId: input.requesterLocationId,
        requestedToLocationId: input.requestedToLocationId ?? null,
        status,
        notes: input.notes ?? null,
        requestedBy: input.requestedBy,
      })
      .returning({ id: stockRequests.id });
    if (!request) throw Conflict('Failed to create stock request');

    await tx.insert(stockRequestLines).values(
      input.lines.map((line) => ({
        requestId: request.id,
        productId: line.productId,
        requestedQuantity: line.requestedQuantity,
        notes: line.notes ?? null,
      })),
    );

    return request;
  });

  return { id: created.id };
}

export async function submitStockRequestSvc(id: string) {
  const request = await getStockRequestRepo(id);
  if (!request) throw NotFound('Stock request not found');
  if (request.status !== StockRequestStatus.DRAFT) {
    throw BadRequest('Only draft requests can be submitted');
  }
  const updated = await updateStockRequestRepo(id, { status: StockRequestStatus.SUBMITTED });
  return { id: updated?.id };
}

export async function approveStockRequestSvc(id: string, approvedBy: string) {
  const request = await getStockRequestRepo(id);
  if (!request) throw NotFound('Stock request not found');
  if (request.status !== StockRequestStatus.SUBMITTED) {
    throw BadRequest('Only submitted requests can be approved');
  }
  const updated = await updateStockRequestRepo(id, {
    status: StockRequestStatus.APPROVED,
    approvedBy,
    approvedAt: new Date(),
    rejectedBy: null,
    rejectedAt: null,
    rejectionReason: null,
  });
  const lines = await listStockRequestLinesRepo(id);
  for (const line of lines) {
    await ensureStockReservationForRequestLineSvc({
      requestId: id,
      lineId: line.id,
      createdBy: approvedBy,
    });
  }
  return { id: updated?.id };
}

export async function rejectStockRequestSvc(
  id: string,
  rejectedBy: string,
  reason?: string | null,
) {
  const request = await getStockRequestRepo(id);
  if (!request) throw NotFound('Stock request not found');
  if (request.status !== StockRequestStatus.SUBMITTED) {
    throw BadRequest('Only submitted requests can be rejected');
  }
  const updated = await updateStockRequestRepo(id, {
    status: StockRequestStatus.REJECTED,
    rejectedBy,
    rejectedAt: new Date(),
    rejectionReason: reason ?? null,
  });
  return { id: updated?.id };
}

export async function fulfillStockRequestLineSvc(input: {
  requestId: string;
  lineId: string;
  fromLocationId: string;
  sourceLotId?: string | null;
  fulfillQuantity: number;
  fulfilledBy: string;
  notes?: string | null;
}) {
  if (!Number.isInteger(input.fulfillQuantity) || input.fulfillQuantity <= 0) {
    throw BadRequest('Fulfillment quantity must be a positive integer in base units');
  }

  const request = await getStockRequestRepo(input.requestId);
  if (!request) throw NotFound('Stock request not found');
  if (
    request.status !== StockRequestStatus.APPROVED &&
    request.status !== StockRequestStatus.PARTIALLY_FULFILLED
  ) {
    throw BadRequest('Only approved or partially fulfilled requests can be fulfilled');
  }

  const line = await getStockRequestLineRepo(input.lineId);
  if (!line || line.requestId !== request.id) {
    throw NotFound('Stock request line not found');
  }

  const remaining = Number(line.requestedQuantity) - Number(line.fulfilledQuantity);
  if (input.fulfillQuantity > remaining) {
    throw BadRequest('Fulfillment quantity exceeds remaining request quantity');
  }

  const sourceLocation = await getInventoryLocationRepo(input.fromLocationId);
  if (!sourceLocation) throw NotFound('Source location not found');
  if (sourceLocation.companyId !== request.companyId)
    throw BadRequest('Source location must belong to the same company');

  const sourceLevel = await getStockLevelRepo(line.productId, input.fromLocationId);
  const sourceQty = Number(sourceLevel?.quantity ?? 0);
  if (sourceQty < input.fulfillQuantity) {
    throw BadRequest('Insufficient stock at source location');
  }

  const lotRows = await db
    .select()
    .from(stockLots)
    .where(
      and(
        eq(stockLots.companyId, request.companyId),
        eq(stockLots.productId, line.productId),
        eq(stockLots.locationId, input.fromLocationId),
        eq(stockLots.status, StockLotStatus.ACTIVE),
        or(sql`${stockLots.expiryDate} is null`, gte(stockLots.expiryDate, new Date())),
        input.sourceLotId ? eq(stockLots.id, input.sourceLotId) : sql`true`,
      ),
    )
    .orderBy(
      asc(sql`coalesce(${stockLots.expiryDate}, timestamp '2999-12-31')`),
      asc(stockLots.receivedAt),
      asc(stockLots.id),
    );
  if (input.sourceLotId && !lotRows.length) {
    throw BadRequest('Selected source lot was not found or is not active');
  }

  const lotMoves: {
    lotId: string;
    batchNumber: string;
    supplierBatchNumber: string | null;
    expiryDate: Date | null;
    manufacturedAt: Date | null;
    consumeQty: number;
    releaseReservedQty: number;
  }[] = [];
  let remainingLotQty = input.fulfillQuantity;
  for (const lot of lotRows) {
    if (remainingLotQty <= 0) break;
    const onHand = Number(lot.quantityOnHand ?? 0);
    if (onHand <= 0) continue;
    const consumeQty = Math.min(onHand, remainingLotQty);
    if (consumeQty <= 0) continue;
    const reserved = Number(lot.reservedQuantity ?? 0);
    const releaseReservedQty = Math.min(reserved, consumeQty);
    lotMoves.push({
      lotId: lot.id,
      batchNumber: lot.batchNumber,
      supplierBatchNumber: lot.supplierBatchNumber ?? null,
      expiryDate: lot.expiryDate ?? null,
      manufacturedAt: lot.manufacturedAt ?? null,
      consumeQty,
      releaseReservedQty,
    });
    remainingLotQty -= consumeQty;
  }
  if (lotRows.length > 0 && remainingLotQty > 0) {
    throw BadRequest('Insufficient lot stock at source location');
  }

  await db.transaction(async (tx) => {
    const transferLotId =
      input.sourceLotId ?? (lotMoves.length === 1 ? (lotMoves[0]?.lotId ?? null) : null);
    await tx.insert(stockMovements).values({
      companyId: request.companyId,
      productId: line.productId,
      locationId: input.fromLocationId,
      movementType: StockMovementType.TRANSFER_OUT,
      lotId: transferLotId,
      quantity: input.fulfillQuantity,
      referenceId: request.id,
      referenceType: 'stock_request',
      notes: input.notes ?? request.notes,
      createdBy: input.fulfilledBy,
    });

    await tx.insert(stockMovements).values({
      companyId: request.companyId,
      productId: line.productId,
      locationId: request.requesterLocationId,
      movementType: StockMovementType.TRANSFER_IN,
      quantity: input.fulfillQuantity,
      referenceId: request.id,
      referenceType: 'stock_request',
      notes: input.notes ?? request.notes,
      createdBy: input.fulfilledBy,
    });

    for (const move of lotMoves) {
      const [sourceLot] = await tx
        .select()
        .from(stockLots)
        .where(eq(stockLots.id, move.lotId))
        .limit(1);
      if (!sourceLot) continue;
      const nextOnHand = Math.max(0, Number(sourceLot.quantityOnHand) - move.consumeQty);
      const nextReserved = Math.max(
        0,
        Number(sourceLot.reservedQuantity) - move.releaseReservedQty,
      );
      await tx
        .update(stockLots)
        .set({
          quantityOnHand: nextOnHand,
          reservedQuantity: nextReserved,
          status: nextOnHand <= 0 ? StockLotStatus.DEPLETED : sourceLot.status,
          updatedAt: new Date(),
        })
        .where(eq(stockLots.id, sourceLot.id));
      await tx.insert(stockLotMovements).values({
        companyId: request.companyId,
        lotId: sourceLot.id,
        productId: line.productId,
        locationId: input.fromLocationId,
        movementType: StockMovementType.TRANSFER_OUT,
        quantity: move.consumeQty,
        referenceId: request.id,
        referenceType: 'stock_request',
        notes: input.notes ?? request.notes,
        createdBy: input.fulfilledBy,
      });

      const [destLot] = await tx
        .select()
        .from(stockLots)
        .where(
          and(
            eq(stockLots.companyId, request.companyId),
            eq(stockLots.productId, line.productId),
            eq(stockLots.locationId, request.requesterLocationId),
            sql`lower(${stockLots.batchNumber}) = lower(${move.batchNumber})`,
          ),
        )
        .limit(1);
      let destLotId = destLot?.id ?? null;
      if (destLot) {
        await tx
          .update(stockLots)
          .set({
            quantityOnHand: Number(destLot.quantityOnHand) + move.consumeQty,
            status: StockLotStatus.ACTIVE,
            updatedAt: new Date(),
          })
          .where(eq(stockLots.id, destLot.id));
      } else {
        const [createdLot] = await tx
          .insert(stockLots)
          .values({
            companyId: request.companyId,
            productId: line.productId,
            locationId: request.requesterLocationId,
            batchNumber: move.batchNumber,
            supplierBatchNumber: move.supplierBatchNumber ?? null,
            receivedAt: new Date(),
            manufacturedAt: move.manufacturedAt ?? null,
            expiryDate: move.expiryDate ?? null,
            quantityOnHand: move.consumeQty,
            reservedQuantity: 0,
            status: StockLotStatus.ACTIVE,
            notes: input.notes ?? request.notes ?? null,
            createdBy: input.fulfilledBy,
          })
          .returning({ id: stockLots.id });
        destLotId = createdLot?.id ?? null;
      }

      if (destLotId) {
        await tx.insert(stockLotMovements).values({
          companyId: request.companyId,
          lotId: destLotId,
          productId: line.productId,
          locationId: request.requesterLocationId,
          movementType: StockMovementType.TRANSFER_IN,
          quantity: move.consumeQty,
          referenceId: request.id,
          referenceType: 'stock_request',
          notes: input.notes ?? request.notes,
          createdBy: input.fulfilledBy,
        });
      }
    }

    const destinationLevel = await getStockLevelRepo(line.productId, request.requesterLocationId);
    const destinationQty = Number(destinationLevel?.quantity ?? 0);

    await tx
      .insert(stockLevels)
      .values({
        companyId: request.companyId,
        productId: line.productId,
        locationId: input.fromLocationId,
        quantity: sourceQty - input.fulfillQuantity,
      })
      .onConflictDoUpdate({
        target: [stockLevels.productId, stockLevels.locationId],
        set: { quantity: sourceQty - input.fulfillQuantity, updatedAt: new Date() },
      });

    await tx
      .insert(stockLevels)
      .values({
        companyId: request.companyId,
        productId: line.productId,
        locationId: request.requesterLocationId,
        quantity: destinationQty + input.fulfillQuantity,
      })
      .onConflictDoUpdate({
        target: [stockLevels.productId, stockLevels.locationId],
        set: { quantity: destinationQty + input.fulfillQuantity, updatedAt: new Date() },
      });

    await tx
      .update(stockRequestLines)
      .set({
        fulfilledQuantity: Number(line.fulfilledQuantity) + input.fulfillQuantity,
        updatedAt: new Date(),
      })
      .where(eq(stockRequestLines.id, line.id));
  });

  const allLines = await listStockRequestLinesRepo(request.id);
  const allFulfilled = allLines.every(
    (row) => Number(row.fulfilledQuantity) >= Number(row.requestedQuantity),
  );
  const someFulfilled = allLines.some((row) => Number(row.fulfilledQuantity) > 0);

  const nextStatus = allFulfilled
    ? StockRequestStatus.FULFILLED
    : someFulfilled
      ? StockRequestStatus.PARTIALLY_FULFILLED
      : StockRequestStatus.APPROVED;

  await updateStockRequestRepo(request.id, { status: nextStatus });
  await syncReservationIssueProgressSvc({
    lineId: line.id,
    fromLocationId: input.fromLocationId,
    fulfilledQuantity: input.fulfillQuantity,
  });
  return { id: request.id };
}

export async function getStockRequestLineAllocationSvc(input: {
  requestId: string;
  lineId: string;
}) {
  const request = await getStockRequestRepo(input.requestId);
  if (!request) throw NotFound('Stock request not found');
  const line = await getStockRequestLineRepo(input.lineId);
  if (!line || line.requestId !== request.id) throw NotFound('Stock request line not found');

  const remaining = Math.max(0, Number(line.requestedQuantity) - Number(line.fulfilledQuantity));
  const candidates = await db
    .select({
      locationId: stockLevels.locationId,
      availableQuantity: stockLevels.quantity,
      locationType: inventoryLocations.locationType,
      parentLocationId: inventoryLocations.parentLocationId,
    })
    .from(stockLevels)
    .innerJoin(inventoryLocations, eq(inventoryLocations.id, stockLevels.locationId))
    .where(
      and(
        eq(stockLevels.companyId, request.companyId),
        eq(stockLevels.productId, line.productId),
        gt(stockLevels.quantity, 0),
      ),
    );

  const filtered = candidates.filter((row) => row.locationId !== request.requesterLocationId);
  const prioritized = filtered.sort((a, b) => {
    const priority = (row: (typeof filtered)[number]) => {
      if (request.requestedToLocationId && row.locationId === request.requestedToLocationId)
        return 0;
      if (row.locationType === InventoryLocationType.MAIN_STORE) return 1;
      if (row.locationType === InventoryLocationType.BRANCH_STORE) return 2;
      return 3;
    };
    const p = priority(a) - priority(b);
    if (p !== 0) return p;
    return Number(b.availableQuantity) - Number(a.availableQuantity);
  });

  return {
    requestId: request.id,
    lineId: line.id,
    productId: line.productId,
    requestedQuantity: Number(line.requestedQuantity),
    fulfilledQuantity: Number(line.fulfilledQuantity),
    remainingQuantity: remaining,
    candidates: prioritized.map((row) => ({
      locationId: row.locationId,
      availableQuantity: Number(row.availableQuantity),
      locationType: row.locationType,
      parentLocationId: row.parentLocationId,
    })),
  };
}

export async function autoFulfillStockRequestLineSvc(input: {
  requestId: string;
  lineId: string;
  fulfilledBy: string;
  notes?: string | null;
}) {
  const request = await getStockRequestRepo(input.requestId);
  if (!request) throw NotFound('Stock request not found');
  if (
    request.status !== StockRequestStatus.APPROVED &&
    request.status !== StockRequestStatus.PARTIALLY_FULFILLED
  ) {
    throw BadRequest('Only approved or partially fulfilled requests can be auto-fulfilled');
  }

  const line = await getStockRequestLineRepo(input.lineId);
  if (!line || line.requestId !== request.id) throw NotFound('Stock request line not found');

  let remaining = Number(line.requestedQuantity) - Number(line.fulfilledQuantity);
  if (remaining <= 0) return { id: request.id, fulfilledQuantity: 0, remainingQuantity: 0 };

  const allocation = await getStockRequestLineAllocationSvc({
    requestId: request.id,
    lineId: line.id,
  });
  const candidates = allocation.candidates.filter((row) => row.availableQuantity > 0);
  if (!candidates.length) {
    throw BadRequest('No source stock is available to auto-fulfill this request line');
  }

  let fulfilledTotal = 0;
  for (const candidate of candidates) {
    if (remaining <= 0) break;
    const sourceLevel = await getStockLevelRepo(line.productId, candidate.locationId);
    const sourceQty = Number(sourceLevel?.quantity ?? 0);
    if (sourceQty <= 0) continue;
    const fulfillQuantity = Math.min(sourceQty, remaining);
    if (fulfillQuantity <= 0) continue;
    await fulfillStockRequestLineSvc({
      requestId: request.id,
      lineId: line.id,
      fromLocationId: candidate.locationId,
      fulfillQuantity,
      fulfilledBy: input.fulfilledBy,
      notes: input.notes ?? request.notes ?? null,
    });
    fulfilledTotal += fulfillQuantity;
    remaining -= fulfillQuantity;
  }
  return {
    id: request.id,
    fulfilledQuantity: fulfilledTotal,
    remainingQuantity: Math.max(0, remaining),
  };
}

export async function acknowledgeStockRequestLineSvc(input: {
  requestId: string;
  lineId: string;
  acknowledgedQuantity: number;
  acknowledgedBy: string;
  notes?: string | null;
}) {
  if (!Number.isInteger(input.acknowledgedQuantity) || input.acknowledgedQuantity <= 0) {
    throw BadRequest('Acknowledged quantity must be a positive integer');
  }
  const request = await getStockRequestRepo(input.requestId);
  if (!request) throw NotFound('Stock request not found');
  const line = await getStockRequestLineRepo(input.lineId);
  if (!line || line.requestId !== request.id) throw NotFound('Stock request line not found');

  const ackAgg = await db
    .select({
      total: sql<number>`coalesce(sum(${stockRequestAcknowledgements.acknowledgedQuantity}), 0)`,
    })
    .from(stockRequestAcknowledgements)
    .where(eq(stockRequestAcknowledgements.requestLineId, input.lineId));
  const alreadyAcknowledged = Number(ackAgg[0]?.total ?? 0);
  const fulfilled = Number(line.fulfilledQuantity ?? 0);
  const pending = Math.max(0, fulfilled - alreadyAcknowledged);
  if (pending <= 0) {
    throw BadRequest('No fulfilled quantity pending acknowledgement for this line');
  }
  if (input.acknowledgedQuantity > pending) {
    throw BadRequest('Acknowledged quantity exceeds pending fulfilled quantity');
  }

  const [created] = await db
    .insert(stockRequestAcknowledgements)
    .values({
      requestId: request.id,
      requestLineId: line.id,
      acknowledgedQuantity: input.acknowledgedQuantity,
      notes: input.notes ?? null,
      acknowledgedBy: input.acknowledgedBy,
      acknowledgedAt: new Date(),
    })
    .returning({ id: stockRequestAcknowledgements.id });

  const ackAfterAgg = await db
    .select({
      total: sql<number>`coalesce(sum(${stockRequestAcknowledgements.acknowledgedQuantity}), 0)`,
    })
    .from(stockRequestAcknowledgements)
    .where(eq(stockRequestAcknowledgements.requestLineId, input.lineId));
  const acknowledgedTotal = Number(ackAfterAgg[0]?.total ?? 0);

  return {
    id: created?.id,
    requestId: request.id,
    lineId: line.id,
    fulfilledQuantity: fulfilled,
    acknowledgedQuantity: acknowledgedTotal,
    pendingAcknowledgementQuantity: Math.max(0, fulfilled - acknowledgedTotal),
  };
}

// Dashboard
export async function getInventoryDashboardSummarySvc(filters: {
  companyId: string;
  locationId?: string | null;
  lowStockLimit?: number | null;
}) {
  return getInventoryDashboardSummaryRepo({
    companyId: filters.companyId,
    locationId: filters.locationId ?? null,
    lowStockLimit: filters.lowStockLimit ?? 20,
  });
}

function locationPriorityForReorder(row: {
  id: string;
  locationType: number;
  parentLocationId: string | null;
  quantity: number;
}) {
  if (row.locationType === InventoryLocationType.MAIN_STORE) return 0;
  if (row.locationType === InventoryLocationType.BRANCH_STORE) return 1;
  return 2;
}

export async function listReorderSuggestionsSvc(input: {
  companyId: string;
  locationId?: string | null;
  includeZeroMin?: boolean;
}) {
  const levelRows = await db
    .select({
      productId: products.id,
      productName: products.name,
      productSku: products.sku,
      minStockLevel: products.minStockLevel,
      locationId: inventoryLocations.id,
      locationName: inventoryLocations.name,
      locationType: inventoryLocations.locationType,
      parentLocationId: inventoryLocations.parentLocationId,
      quantity: sql<number>`coalesce(${stockLevels.quantity}, 0)`,
    })
    .from(products)
    .innerJoin(inventoryLocations, eq(inventoryLocations.companyId, products.companyId))
    .leftJoin(
      stockLevels,
      and(
        eq(stockLevels.productId, products.id),
        eq(stockLevels.locationId, inventoryLocations.id),
      ),
    )
    .where(
      and(
        eq(products.companyId, input.companyId),
        eq(products.isDeleted, false),
        eq(inventoryLocations.isDeleted, false),
        input.locationId ? eq(inventoryLocations.id, input.locationId) : sql`true`,
      ),
    );

  const supplyRows = await db
    .select({
      productId: stockLevels.productId,
      locationId: stockLevels.locationId,
      locationName: inventoryLocations.name,
      locationType: inventoryLocations.locationType,
      parentLocationId: inventoryLocations.parentLocationId,
      quantity: stockLevels.quantity,
    })
    .from(stockLevels)
    .innerJoin(inventoryLocations, eq(inventoryLocations.id, stockLevels.locationId))
    .where(
      and(
        eq(stockLevels.companyId, input.companyId),
        gt(stockLevels.quantity, 0),
        eq(inventoryLocations.isDeleted, false),
      ),
    );

  const supplyByProduct = new Map<string, typeof supplyRows>();
  for (const row of supplyRows) {
    const existing = supplyByProduct.get(row.productId) ?? [];
    existing.push(row);
    supplyByProduct.set(row.productId, existing);
  }

  const rows = levelRows
    .map((row) => {
      const current = Number(row.quantity ?? 0);
      const minLevel = Number(row.minStockLevel ?? 0);
      const reorderGap = Math.max(0, minLevel - current);
      const candidates = (supplyByProduct.get(row.productId) ?? [])
        .filter((candidate) => candidate.locationId !== row.locationId)
        .sort((a, b) => {
          const pa = locationPriorityForReorder({
            id: a.locationId,
            locationType: a.locationType,
            parentLocationId: a.parentLocationId,
            quantity: Number(a.quantity ?? 0),
          });
          const pb = locationPriorityForReorder({
            id: b.locationId,
            locationType: b.locationType,
            parentLocationId: b.parentLocationId,
            quantity: Number(b.quantity ?? 0),
          });
          if (pa !== pb) return pa - pb;
          return Number(b.quantity ?? 0) - Number(a.quantity ?? 0);
        })
        .slice(0, 3)
        .map((candidate) => ({
          locationId: candidate.locationId,
          locationName: candidate.locationName,
          locationType: candidate.locationType,
          availableQuantity: Number(candidate.quantity ?? 0),
        }));

      return {
        productId: row.productId,
        productName: row.productName,
        productSku: row.productSku,
        locationId: row.locationId,
        locationName: row.locationName,
        locationType: row.locationType,
        currentQuantity: current,
        minStockLevel: minLevel,
        reorderQuantity: reorderGap,
        suggestedSources: candidates,
      };
    })
    .filter((row) => row.reorderQuantity > 0 || Boolean(input.includeZeroMin));

  return {
    generatedAt: new Date().toISOString(),
    companyId: input.companyId,
    locationId: input.locationId ?? null,
    totalRows: rows.length,
    rows: rows.sort((a, b) => b.reorderQuantity - a.reorderQuantity),
  };
}

// 1) Approval policy engine
export async function listInventoryApprovalPoliciesSvc(input: {
  companyId: string;
  entityType?: number | null;
  active?: boolean | null;
}) {
  const rows = await db
    .select()
    .from(inventoryApprovalPolicies)
    .where(
      and(
        eq(inventoryApprovalPolicies.companyId, input.companyId),
        input.entityType !== undefined && input.entityType !== null
          ? eq(inventoryApprovalPolicies.entityType, input.entityType)
          : sql`true`,
        input.active !== undefined && input.active !== null
          ? eq(inventoryApprovalPolicies.active, input.active)
          : sql`true`,
      ),
    )
    .orderBy(asc(inventoryApprovalPolicies.entityType), desc(inventoryApprovalPolicies.createdAt));
  return rows;
}

export async function createInventoryApprovalPolicySvc(input: {
  companyId: string;
  entityType: number;
  minAmount?: number;
  maxAmount?: number | null;
  locationType?: number | null;
  level1ApproverRoleId?: string | null;
  level2ApproverRoleId?: string | null;
  slaHours?: number;
  escalationRoleId?: string | null;
  active?: boolean;
  createdBy: string;
}) {
  const [row] = await db
    .insert(inventoryApprovalPolicies)
    .values({
      companyId: input.companyId,
      entityType: input.entityType,
      minAmount: Math.max(0, Number(input.minAmount ?? 0)),
      maxAmount: input.maxAmount ?? null,
      locationType: input.locationType ?? null,
      level1ApproverRoleId: input.level1ApproverRoleId ?? null,
      level2ApproverRoleId: input.level2ApproverRoleId ?? null,
      slaHours: Math.max(1, Number(input.slaHours ?? 24)),
      escalationRoleId: input.escalationRoleId ?? null,
      active: input.active ?? true,
      createdBy: input.createdBy,
    })
    .returning({ id: inventoryApprovalPolicies.id });
  if (!row) throw Conflict('Failed to create approval policy');

  await appendInventoryEventSvc({
    companyId: input.companyId,
    eventType: InventoryEventType.POLICY_UPDATED,
    entityType: 'inventory_approval_policy',
    entityId: row.id,
    payload: {
      entityType: input.entityType,
      minAmount: input.minAmount ?? 0,
      maxAmount: input.maxAmount ?? null,
    },
    createdBy: input.createdBy,
  });
  return { id: row.id };
}

export async function submitInventoryApprovalRequestSvc(input: {
  companyId: string;
  entityType: number;
  entityId: string;
  amount: number;
  submittedBy: string;
}) {
  const [policy] = await db
    .select()
    .from(inventoryApprovalPolicies)
    .where(
      and(
        eq(inventoryApprovalPolicies.companyId, input.companyId),
        eq(inventoryApprovalPolicies.entityType, input.entityType),
        eq(inventoryApprovalPolicies.active, true),
        lte(inventoryApprovalPolicies.minAmount, input.amount),
        or(
          sql`${inventoryApprovalPolicies.maxAmount} is null`,
          gte(inventoryApprovalPolicies.maxAmount, input.amount),
        ),
      ),
    )
    .orderBy(desc(inventoryApprovalPolicies.minAmount))
    .limit(1);

  const dueAt = new Date(Date.now() + Number(policy?.slaHours ?? 24) * 60 * 60 * 1000);
  const [created] = await db
    .insert(inventoryApprovalRequests)
    .values({
      companyId: input.companyId,
      entityType: input.entityType,
      entityId: input.entityId,
      policyId: policy?.id ?? null,
      status: InventoryApprovalStatus.PENDING,
      levelNo: 1,
      amount: Math.max(0, Math.floor(input.amount)),
      submittedBy: input.submittedBy,
      submittedAt: new Date(),
      dueAt,
    })
    .returning({ id: inventoryApprovalRequests.id });
  if (!created) throw Conflict('Failed to create approval request');

  await appendInventoryEventSvc({
    companyId: input.companyId,
    eventType: InventoryEventType.APPROVAL_SUBMITTED,
    entityType: 'inventory_approval_request',
    entityId: created.id,
    payload: {
      sourceEntityType: input.entityType,
      sourceEntityId: input.entityId,
      amount: input.amount,
    },
    createdBy: input.submittedBy,
  });
  return { id: created.id };
}

export async function listInventoryApprovalRequestsSvc(input: {
  companyId: string;
  status?: number | null;
  entityType?: number | null;
}) {
  const rows = await db
    .select()
    .from(inventoryApprovalRequests)
    .where(
      and(
        eq(inventoryApprovalRequests.companyId, input.companyId),
        input.status !== undefined && input.status !== null
          ? eq(inventoryApprovalRequests.status, input.status)
          : sql`true`,
        input.entityType !== undefined && input.entityType !== null
          ? eq(inventoryApprovalRequests.entityType, input.entityType)
          : sql`true`,
      ),
    )
    .orderBy(desc(inventoryApprovalRequests.submittedAt), desc(inventoryApprovalRequests.id));
  return rows;
}

export async function decideInventoryApprovalRequestSvc(input: {
  id: string;
  status: number;
  decidedBy: string;
  reason?: string | null;
}) {
  const [row] = await db
    .select()
    .from(inventoryApprovalRequests)
    .where(eq(inventoryApprovalRequests.id, input.id))
    .limit(1);
  if (!row) throw NotFound('Approval request not found');
  if (
    row.status !== InventoryApprovalStatus.PENDING &&
    row.status !== InventoryApprovalStatus.ESCALATED
  ) {
    throw BadRequest('Only pending or escalated approval requests can be decided');
  }
  if (
    input.status !== InventoryApprovalStatus.APPROVED &&
    input.status !== InventoryApprovalStatus.REJECTED
  ) {
    throw BadRequest('Decision must be approved or rejected');
  }

  await db
    .update(inventoryApprovalRequests)
    .set({
      status: input.status,
      decidedBy: input.decidedBy,
      decidedAt: new Date(),
      decisionReason: input.reason ?? null,
      updatedAt: new Date(),
    })
    .where(eq(inventoryApprovalRequests.id, input.id));

  await appendInventoryEventSvc({
    companyId: row.companyId,
    eventType: InventoryEventType.APPROVAL_DECIDED,
    entityType: 'inventory_approval_request',
    entityId: row.id,
    payload: { status: input.status, reason: input.reason ?? null },
    createdBy: input.decidedBy,
  });
  return { id: row.id };
}

export async function escalateOverdueInventoryApprovalRequestsSvc(input: {
  companyId: string;
  actorUserId: string;
}) {
  const now = new Date();
  const rows = await db
    .select()
    .from(inventoryApprovalRequests)
    .where(
      and(
        eq(inventoryApprovalRequests.companyId, input.companyId),
        eq(inventoryApprovalRequests.status, InventoryApprovalStatus.PENDING),
        sql`${inventoryApprovalRequests.dueAt} is not null`,
        lte(inventoryApprovalRequests.dueAt, now),
      ),
    );

  for (const row of rows) {
    await db
      .update(inventoryApprovalRequests)
      .set({
        status: InventoryApprovalStatus.ESCALATED,
        escalationAt: now,
        updatedAt: now,
      })
      .where(eq(inventoryApprovalRequests.id, row.id));
    await appendInventoryEventSvc({
      companyId: row.companyId,
      eventType: InventoryEventType.APPROVAL_DECIDED,
      entityType: 'inventory_approval_request',
      entityId: row.id,
      payload: { status: InventoryApprovalStatus.ESCALATED, automated: true },
      createdBy: input.actorUserId,
    });
  }
  return { escalatedCount: rows.length };
}

// 2) Valuation + finance integration
export async function getInventoryValuationSummarySvc(input: {
  companyId: string;
  locationId?: string | null;
}) {
  const rows = await db
    .select({
      productId: stockLevels.productId,
      locationId: stockLevels.locationId,
      quantity: stockLevels.quantity,
      minStockLevel: products.minStockLevel,
    })
    .from(stockLevels)
    .innerJoin(products, eq(products.id, stockLevels.productId))
    .where(
      and(
        eq(stockLevels.companyId, input.companyId),
        input.locationId ? eq(stockLevels.locationId, input.locationId) : sql`true`,
      ),
    );

  const avgUnitCost = 1;
  const totals = rows.reduce(
    (acc, row) => {
      const qty = Number(row.quantity ?? 0);
      const value = qty * avgUnitCost;
      acc.totalQuantity += qty;
      acc.totalValue += value;
      return acc;
    },
    { totalQuantity: 0, totalValue: 0 },
  );
  return {
    generatedAt: new Date().toISOString(),
    method: InventoryValuationMethod.WEIGHTED_AVERAGE,
    totals,
    rows: rows.map((row) => {
      const qty = Number(row.quantity ?? 0);
      return {
        productId: row.productId,
        locationId: row.locationId,
        quantity: qty,
        averageUnitCost: avgUnitCost,
        totalValue: qty * avgUnitCost,
      };
    }),
  };
}

export async function recomputeInventoryValuationSnapshotsSvc(input: {
  companyId: string;
  method?: number;
  actorUserId: string;
}) {
  const method = input.method ?? InventoryValuationMethod.WEIGHTED_AVERAGE;
  const rows = await db
    .select({
      productId: stockLevels.productId,
      locationId: stockLevels.locationId,
      quantity: stockLevels.quantity,
    })
    .from(stockLevels)
    .where(eq(stockLevels.companyId, input.companyId));

  let count = 0;
  for (const row of rows) {
    const quantity = Number(row.quantity ?? 0);
    const averageUnitCost = 1;
    const totalValue = quantity * averageUnitCost;
    await db.insert(inventoryValuationSnapshots).values({
      companyId: input.companyId,
      productId: row.productId,
      locationId: row.locationId,
      method,
      quantity,
      averageUnitCost,
      totalValue,
      snapshotAt: new Date(),
      createdBy: input.actorUserId,
    });
    count += 1;
  }

  await appendInventoryEventSvc({
    companyId: input.companyId,
    eventType: InventoryEventType.VALUATION_RECOMPUTED,
    entityType: 'inventory_valuation_snapshot',
    entityId: `batch-${Date.now()}`,
    payload: { rows: count, method },
    createdBy: input.actorUserId,
  });

  return { snapshottedRows: count, method };
}

export async function syncInventoryFinancialPostingsSvc(input: {
  companyId: string;
  actorUserId: string;
  dateFrom?: Date | null;
  dateTo?: Date | null;
}) {
  const movementRows = await db
    .select()
    .from(stockMovements)
    .leftJoin(
      inventoryFinancialPostings,
      eq(inventoryFinancialPostings.movementId, stockMovements.id),
    )
    .where(
      and(
        eq(stockMovements.companyId, input.companyId),
        input.dateFrom ? gte(stockMovements.createdAt, input.dateFrom) : sql`true`,
        input.dateTo ? lte(stockMovements.createdAt, input.dateTo) : sql`true`,
        sql`${inventoryFinancialPostings.id} is null`,
      ),
    );

  let posted = 0;
  for (const row of movementRows) {
    const amount = Math.max(0, Number(row.stock_movements.quantity ?? 0));
    await db.insert(inventoryFinancialPostings).values({
      companyId: row.stock_movements.companyId,
      movementId: row.stock_movements.id,
      accountCodeDr: '1300',
      accountCodeCr: '5180',
      amount,
      postingDate: new Date(),
      postedBy: input.actorUserId,
    });
    posted += 1;
  }
  return { posted };
}

// 3) Planning engine
function buildProposalNo() {
  return `RPL-${Date.now().toString(36).toUpperCase()}`;
}

export async function generateReplenishmentProposalSvc(input: {
  companyId: string;
  scopeLocationId?: string | null;
  leadTimeDays?: number;
  coverageDays?: number;
  generatedBy: string;
  notes?: string | null;
}) {
  const suggestions = await listReorderSuggestionsSvc({
    companyId: input.companyId,
    locationId: input.scopeLocationId ?? null,
  });
  const [proposal] = await db
    .insert(inventoryReplenishmentProposals)
    .values({
      companyId: input.companyId,
      proposalNo: buildProposalNo(),
      scopeLocationId: input.scopeLocationId ?? null,
      leadTimeDays: Math.max(1, Number(input.leadTimeDays ?? 7)),
      coverageDays: Math.max(1, Number(input.coverageDays ?? 14)),
      status: InventoryReplenishmentProposalStatus.DRAFT,
      notes: input.notes ?? null,
      generatedBy: input.generatedBy,
      generatedAt: new Date(),
    })
    .returning({ id: inventoryReplenishmentProposals.id });
  if (!proposal) throw Conflict('Failed to generate replenishment proposal');

  if (suggestions.rows.length) {
    await db.insert(inventoryReplenishmentProposalLines).values(
      suggestions.rows.map((row) => ({
        proposalId: proposal.id,
        productId: row.productId,
        locationId: row.locationId,
        currentQuantity: Number(row.currentQuantity ?? 0),
        minStockLevel: Number(row.minStockLevel ?? 0),
        suggestedQuantity: Number(row.reorderQuantity ?? 0),
        sourceLocationId: row.suggestedSources[0]?.locationId ?? null,
      })),
    );
  }

  await appendInventoryEventSvc({
    companyId: input.companyId,
    eventType: InventoryEventType.REPLENISHMENT_GENERATED,
    entityType: 'inventory_replenishment_proposal',
    entityId: proposal.id,
    payload: { lines: suggestions.rows.length },
    createdBy: input.generatedBy,
  });
  return { id: proposal.id, lines: suggestions.rows.length };
}

export async function listReplenishmentProposalsSvc(input: {
  companyId: string;
  status?: number | null;
}) {
  const rows = await db
    .select()
    .from(inventoryReplenishmentProposals)
    .where(
      and(
        eq(inventoryReplenishmentProposals.companyId, input.companyId),
        input.status !== undefined && input.status !== null
          ? eq(inventoryReplenishmentProposals.status, input.status)
          : sql`true`,
      ),
    )
    .orderBy(
      desc(inventoryReplenishmentProposals.generatedAt),
      desc(inventoryReplenishmentProposals.id),
    );
  return rows;
}

export async function getReplenishmentProposalSvc(id: string) {
  const [proposal] = await db
    .select()
    .from(inventoryReplenishmentProposals)
    .where(eq(inventoryReplenishmentProposals.id, id))
    .limit(1);
  if (!proposal) throw NotFound('Replenishment proposal not found');
  const lines = await db
    .select()
    .from(inventoryReplenishmentProposalLines)
    .where(eq(inventoryReplenishmentProposalLines.proposalId, id))
    .orderBy(desc(inventoryReplenishmentProposalLines.suggestedQuantity));
  return { ...proposal, lines };
}

export async function decideReplenishmentProposalSvc(input: {
  id: string;
  status: number;
  actorUserId: string;
}) {
  const [proposal] = await db
    .select()
    .from(inventoryReplenishmentProposals)
    .where(eq(inventoryReplenishmentProposals.id, input.id))
    .limit(1);
  if (!proposal) throw NotFound('Replenishment proposal not found');
  if (
    input.status !== InventoryReplenishmentProposalStatus.SUBMITTED &&
    input.status !== InventoryReplenishmentProposalStatus.APPROVED &&
    input.status !== InventoryReplenishmentProposalStatus.REJECTED
  ) {
    throw BadRequest('Invalid proposal status transition');
  }
  await db
    .update(inventoryReplenishmentProposals)
    .set({
      status: input.status,
      approvedBy:
        input.status === InventoryReplenishmentProposalStatus.APPROVED ? input.actorUserId : null,
      approvedAt:
        input.status === InventoryReplenishmentProposalStatus.APPROVED ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(inventoryReplenishmentProposals.id, input.id));

  await appendInventoryEventSvc({
    companyId: proposal.companyId,
    eventType: InventoryEventType.REPLENISHMENT_DECIDED,
    entityType: 'inventory_replenishment_proposal',
    entityId: proposal.id,
    payload: { status: input.status },
    createdBy: input.actorUserId,
  });
  return { id: proposal.id };
}

// 4) Physical operations layer
export async function listInventoryTasksSvc(input: {
  companyId: string;
  status?: number | null;
  taskType?: number | null;
}) {
  const rows = await db
    .select()
    .from(inventoryTasks)
    .where(
      and(
        eq(inventoryTasks.companyId, input.companyId),
        input.status !== undefined && input.status !== null
          ? eq(inventoryTasks.status, input.status)
          : sql`true`,
        input.taskType !== undefined && input.taskType !== null
          ? eq(inventoryTasks.taskType, input.taskType)
          : sql`true`,
      ),
    )
    .orderBy(desc(inventoryTasks.createdAt), desc(inventoryTasks.id));
  return rows;
}

export async function getInventoryTaskSvc(id: string) {
  const [task] = await db.select().from(inventoryTasks).where(eq(inventoryTasks.id, id)).limit(1);
  if (!task) throw NotFound('Inventory task not found');
  const scans = await db
    .select()
    .from(inventoryTaskScans)
    .where(eq(inventoryTaskScans.taskId, id))
    .orderBy(desc(inventoryTaskScans.scannedAt), desc(inventoryTaskScans.id));
  return { ...task, scans };
}

export async function createInventoryTaskSvc(input: {
  companyId: string;
  taskType: number;
  productId?: string | null;
  fromLocationId?: string | null;
  toLocationId?: string | null;
  plannedQuantity?: number;
  assignedTo?: string | null;
  notes?: string | null;
  createdBy: string;
}) {
  const [task] = await db
    .insert(inventoryTasks)
    .values({
      companyId: input.companyId,
      taskType: input.taskType,
      status: InventoryTaskStatus.OPEN,
      productId: input.productId ?? null,
      fromLocationId: input.fromLocationId ?? null,
      toLocationId: input.toLocationId ?? null,
      plannedQuantity: Math.max(0, Number(input.plannedQuantity ?? 0)),
      processedQuantity: 0,
      assignedTo: input.assignedTo ?? null,
      notes: input.notes ?? null,
      createdBy: input.createdBy,
    })
    .returning({ id: inventoryTasks.id });
  if (!task) throw Conflict('Failed to create inventory task');
  await appendInventoryEventSvc({
    companyId: input.companyId,
    eventType: InventoryEventType.TASK_CREATED,
    entityType: 'inventory_task',
    entityId: task.id,
    payload: { taskType: input.taskType, plannedQuantity: input.plannedQuantity ?? 0 },
    createdBy: input.createdBy,
  });
  return { id: task.id };
}

export async function updateInventoryTaskStatusSvc(input: {
  id: string;
  status: number;
  actorUserId: string;
}) {
  const [task] = await db
    .select()
    .from(inventoryTasks)
    .where(eq(inventoryTasks.id, input.id))
    .limit(1);
  if (!task) throw NotFound('Inventory task not found');
  await db
    .update(inventoryTasks)
    .set({
      status: input.status,
      startedAt: input.status === InventoryTaskStatus.IN_PROGRESS ? new Date() : task.startedAt,
      completedAt: input.status === InventoryTaskStatus.COMPLETED ? new Date() : task.completedAt,
      updatedAt: new Date(),
    })
    .where(eq(inventoryTasks.id, input.id));
  return { id: input.id };
}

export async function scanInventoryTaskSvc(input: {
  taskId: string;
  scanCode: string;
  quantity: number;
  scannedBy: string;
}) {
  if (!input.scanCode.trim()) throw BadRequest('Scan code is required');
  if (!Number.isInteger(input.quantity) || input.quantity <= 0) {
    throw BadRequest('Scan quantity must be a positive integer');
  }
  const [task] = await db
    .select()
    .from(inventoryTasks)
    .where(eq(inventoryTasks.id, input.taskId))
    .limit(1);
  if (!task) throw NotFound('Inventory task not found');
  if (
    task.status === InventoryTaskStatus.CANCELLED ||
    task.status === InventoryTaskStatus.COMPLETED
  ) {
    throw BadRequest('Cannot scan a cancelled/completed task');
  }
  await db.transaction(async (tx) => {
    await tx.insert(inventoryTaskScans).values({
      taskId: input.taskId,
      scanCode: input.scanCode.trim(),
      quantity: input.quantity,
      scannedBy: input.scannedBy,
      scannedAt: new Date(),
    });
    await tx
      .update(inventoryTasks)
      .set({
        status: InventoryTaskStatus.IN_PROGRESS,
        processedQuantity: Number(task.processedQuantity ?? 0) + input.quantity,
        startedAt: task.startedAt ?? new Date(),
        updatedAt: new Date(),
      })
      .where(eq(inventoryTasks.id, input.taskId));
  });
  await appendInventoryEventSvc({
    companyId: task.companyId,
    eventType: InventoryEventType.TASK_SCANNED,
    entityType: 'inventory_task',
    entityId: task.id,
    payload: { scanCode: input.scanCode, quantity: input.quantity },
    createdBy: input.scannedBy,
  });
  return { id: input.taskId };
}

// 5) Audit/compliance hardening
export async function listInventoryEventJournalSvc(input: {
  companyId: string;
  entityType?: string | null;
  entityId?: string | null;
  eventType?: number | null;
}) {
  const rows = await db
    .select()
    .from(inventoryEventJournal)
    .where(
      and(
        eq(inventoryEventJournal.companyId, input.companyId),
        input.entityType ? eq(inventoryEventJournal.entityType, input.entityType) : sql`true`,
        input.entityId ? eq(inventoryEventJournal.entityId, input.entityId) : sql`true`,
        input.eventType !== undefined && input.eventType !== null
          ? eq(inventoryEventJournal.eventType, input.eventType)
          : sql`true`,
      ),
    )
    .orderBy(desc(inventoryEventJournal.createdAt), desc(inventoryEventJournal.id))
    .limit(1000);
  return rows;
}

export async function postInventoryCorrectionSvc(input: {
  companyId: string;
  productId: string;
  locationId: string;
  quantityChange: number;
  notes?: string | null;
  actorUserId: string;
}) {
  if (!Number.isInteger(input.quantityChange) || input.quantityChange === 0) {
    throw BadRequest('Correction quantity must be a non-zero integer');
  }
  const current = await getStockLevelRepo(input.productId, input.locationId);
  const currentQty = Number(current?.quantity ?? 0);
  const nextQty = currentQty + input.quantityChange;
  if (nextQty < 0) throw BadRequest('Correction cannot make stock negative');

  const [movement] = await db
    .insert(stockMovements)
    .values({
      companyId: input.companyId,
      productId: input.productId,
      locationId: input.locationId,
      movementType: StockMovementType.ADJUSTMENT,
      quantity: input.quantityChange,
      referenceType: 'inventory_correction',
      notes: input.notes ?? null,
      createdBy: input.actorUserId,
    })
    .returning({ id: stockMovements.id });
  if (!movement) throw Conflict('Failed to post inventory correction movement');

  await db.insert(stockAdjustments).values({
    companyId: input.companyId,
    productId: input.productId,
    locationId: input.locationId,
    reason: StockAdjustmentReason.RECOUNT,
    quantityChange: input.quantityChange,
    notes: input.notes ?? null,
    createdBy: input.actorUserId,
  });

  await upsertStockLevelRepo({
    companyId: input.companyId,
    productId: input.productId,
    locationId: input.locationId,
    quantity: nextQty,
  });

  await appendInventoryEventSvc({
    companyId: input.companyId,
    eventType: InventoryEventType.CORRECTION_POSTED,
    entityType: 'stock_movement',
    entityId: movement.id,
    payload: {
      productId: input.productId,
      locationId: input.locationId,
      quantityChange: input.quantityChange,
    },
    createdBy: input.actorUserId,
  });
  return { id: movement.id };
}

// 6) Enterprise reporting pack
export async function getInventoryEnterpriseKpisSvc(input: {
  companyId: string;
  locationId?: string | null;
  days?: number;
}) {
  const days = Math.max(1, Math.min(365, Number(input.days ?? 30)));
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [movementAgg] = await db
    .select({
      moveCount: sql<number>`count(*)`,
      issueQty: sql<number>`coalesce(sum(case when ${stockMovements.movementType} = ${StockMovementType.ISSUE} then ${stockMovements.quantity} else 0 end), 0)`,
      receiptQty: sql<number>`coalesce(sum(case when ${stockMovements.movementType} = ${StockMovementType.RECEIPT} then ${stockMovements.quantity} else 0 end), 0)`,
    })
    .from(stockMovements)
    .where(
      and(
        eq(stockMovements.companyId, input.companyId),
        input.locationId ? eq(stockMovements.locationId, input.locationId) : sql`true`,
        gte(stockMovements.createdAt, since),
      ),
    );

  const [requestAgg] = await db
    .select({
      lineCount: sql<number>`count(*)`,
      requestedQty: sql<number>`coalesce(sum(${stockRequestLines.requestedQuantity}), 0)`,
      fulfilledQty: sql<number>`coalesce(sum(${stockRequestLines.fulfilledQuantity}), 0)`,
    })
    .from(stockRequestLines)
    .innerJoin(stockRequests, eq(stockRequests.id, stockRequestLines.requestId))
    .where(
      and(
        eq(stockRequests.companyId, input.companyId),
        input.locationId ? eq(stockRequests.requesterLocationId, input.locationId) : sql`true`,
        gte(stockRequests.createdAt, since),
      ),
    );

  const [agingAgg] = await db
    .select({
      nearExpiryLots: sql<number>`coalesce(sum(case when ${stockLots.expiryDate} <= now() + interval '30 day' then 1 else 0 end), 0)`,
      expiredLots: sql<number>`coalesce(sum(case when ${stockLots.expiryDate} < now() then 1 else 0 end), 0)`,
      atRiskQty: sql<number>`coalesce(sum(case when ${stockLots.expiryDate} <= now() + interval '30 day' then ${stockLots.quantityOnHand} else 0 end), 0)`,
    })
    .from(stockLots)
    .where(
      and(
        eq(stockLots.companyId, input.companyId),
        input.locationId ? eq(stockLots.locationId, input.locationId) : sql`true`,
      ),
    );

  const requestedQty = Number(requestAgg?.requestedQty ?? 0);
  const fulfilledQty = Number(requestAgg?.fulfilledQty ?? 0);
  const fillRate = requestedQty > 0 ? Math.round((fulfilledQty / requestedQty) * 10000) / 100 : 100;

  return {
    generatedAt: new Date().toISOString(),
    windowDays: days,
    movements: {
      count: Number(movementAgg?.moveCount ?? 0),
      issueQuantity: Number(movementAgg?.issueQty ?? 0),
      receiptQuantity: Number(movementAgg?.receiptQty ?? 0),
    },
    serviceLevel: {
      requestLines: Number(requestAgg?.lineCount ?? 0),
      requestedQuantity: requestedQty,
      fulfilledQuantity: fulfilledQty,
      fillRatePct: fillRate,
    },
    aging: {
      nearExpiryLots: Number(agingAgg?.nearExpiryLots ?? 0),
      expiredLots: Number(agingAgg?.expiredLots ?? 0),
      atRiskQuantity: Number(agingAgg?.atRiskQty ?? 0),
    },
  };
}

// Stock Maintenance
export async function listStockMaintenanceRecordsSvc(p: ListStockMaintenanceRecordsParams) {
  return listStockMaintenanceRecordsRepo(p);
}

export async function getStockMaintenanceRecordSvc(id: string) {
  const row = await getStockMaintenanceRecordRepo(id);
  if (!row) throw NotFound('Stock maintenance record not found');
  return row;
}

export async function createStockMaintenanceRecordSvc(input: {
  companyId: string;
  productId: string;
  locationId: string;
  issueType: number;
  quantity: number;
  notes?: string | null;
  createdBy: string;
}) {
  if (!isInventoryMaintenanceIssueType(input.issueType)) {
    throw BadRequest('Invalid maintenance issue type');
  }
  if (!Number.isInteger(input.quantity) || input.quantity <= 0) {
    throw BadRequest('Maintenance quantity must be a positive integer');
  }

  const product = await getProductRepo(input.productId);
  if (!product) throw NotFound('Product not found');
  const location = await getInventoryLocationRepo(input.locationId);
  if (!location) throw NotFound('Inventory location not found');
  if (location.companyId !== input.companyId)
    throw BadRequest('Location must belong to the same company');

  if (input.issueType === InventoryMaintenanceIssueType.MAINTENANCE && !product.isRecoverable) {
    throw BadRequest('This product is not configured as recoverable');
  }

  const currentLevel = await getStockLevelRepo(input.productId, input.locationId);
  const currentQty = Number(currentLevel?.quantity ?? 0);
  if (currentQty < input.quantity) {
    throw BadRequest('Insufficient stock at source location');
  }

  const created = await db.transaction(async (tx) => {
    const [record] = await tx
      .insert(stockMaintenanceRecords)
      .values({
        companyId: input.companyId,
        productId: input.productId,
        locationId: input.locationId,
        issueType: input.issueType,
        status: InventoryMaintenanceStatus.OPEN,
        quantity: input.quantity,
        notes: input.notes ?? null,
        createdBy: input.createdBy,
      })
      .returning({ id: stockMaintenanceRecords.id });
    if (!record) throw Conflict('Failed to create stock maintenance record');

    await tx.insert(stockMovements).values({
      companyId: input.companyId,
      productId: input.productId,
      locationId: input.locationId,
      movementType: StockMovementType.ISSUE,
      quantity: input.quantity,
      referenceId: record.id,
      referenceType: 'maintenance_open',
      notes: input.notes ?? null,
      createdBy: input.createdBy,
    });

    await tx
      .insert(stockLevels)
      .values({
        companyId: input.companyId,
        productId: input.productId,
        locationId: input.locationId,
        quantity: currentQty - input.quantity,
      })
      .onConflictDoUpdate({
        target: [stockLevels.productId, stockLevels.locationId],
        set: { quantity: currentQty - input.quantity, updatedAt: new Date() },
      });

    return record;
  });

  return { id: created.id };
}

export async function resolveStockMaintenanceRecordSvc(input: {
  id: string;
  quantityReturned?: number;
  quantityDisposed?: number;
  notes?: string | null;
  resolvedBy: string;
}) {
  const record = await getStockMaintenanceRecordRepo(input.id);
  if (!record) throw NotFound('Stock maintenance record not found');
  if (record.status !== InventoryMaintenanceStatus.OPEN) {
    throw BadRequest('Stock maintenance record is already closed');
  }

  const product = await getProductRepo(record.productId);
  if (!product) throw NotFound('Product not found');

  const quantityReturned = input.quantityReturned ?? 0;
  const computedDisposed = record.quantity - quantityReturned;
  const quantityDisposed = input.quantityDisposed ?? computedDisposed;

  if (!Number.isInteger(quantityReturned) || quantityReturned < 0) {
    throw BadRequest('Returned quantity must be a non-negative integer');
  }
  if (!Number.isInteger(quantityDisposed) || quantityDisposed < 0) {
    throw BadRequest('Disposed quantity must be a non-negative integer');
  }
  if (quantityReturned + quantityDisposed !== Number(record.quantity)) {
    throw BadRequest('Returned + disposed quantities must equal recorded quantity');
  }
  if (!product.isRecoverable && quantityReturned > 0) {
    throw BadRequest('Non-recoverable products cannot be returned to stock');
  }
  if (record.issueType === InventoryMaintenanceIssueType.MISSING && quantityReturned > 0) {
    throw BadRequest('Missing records cannot return quantity to stock');
  }

  await db.transaction(async (tx) => {
    if (quantityReturned > 0) {
      await tx.insert(stockMovements).values({
        companyId: record.companyId,
        productId: record.productId,
        locationId: record.locationId,
        movementType: StockMovementType.RECEIPT,
        quantity: quantityReturned,
        referenceId: record.id,
        referenceType: 'maintenance_resolve',
        notes: input.notes ?? record.notes,
        createdBy: input.resolvedBy,
      });

      const currentLevel = await tx
        .select({ quantity: stockLevels.quantity })
        .from(stockLevels)
        .where(
          and(
            eq(stockLevels.companyId, record.companyId),
            eq(stockLevels.productId, record.productId),
            eq(stockLevels.locationId, record.locationId),
          ),
        )
        .limit(1);
      const currentQty = Number(currentLevel[0]?.quantity ?? 0);

      await tx
        .insert(stockLevels)
        .values({
          companyId: record.companyId,
          productId: record.productId,
          locationId: record.locationId,
          quantity: currentQty + quantityReturned,
        })
        .onConflictDoUpdate({
          target: [stockLevels.productId, stockLevels.locationId],
          set: { quantity: currentQty + quantityReturned, updatedAt: new Date() },
        });
    }

    await tx
      .update(stockMaintenanceRecords)
      .set({
        status: InventoryMaintenanceStatus.CLOSED,
        quantityReturned,
        quantityDisposed,
        resolvedBy: input.resolvedBy,
        resolvedAt: new Date(),
        notes: input.notes ?? record.notes,
        updatedAt: new Date(),
      })
      .where(eq(stockMaintenanceRecords.id, record.id));
  });

  return { id: record.id };
}

// Reports
export async function getLowStockReportSvc(filters: {
  companyId?: string | null;
  branchId?: string | null;
  locationId?: string | null;
}) {
  return getLowStockProductsRepo(filters);
}

export async function getMovementHistorySvc(p: MovementHistoryParams) {
  return getMovementHistoryRepo(p);
}
