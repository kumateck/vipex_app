import { Conflict, NotFound } from '@/server/utils/http-error';
import { recordAuditLog } from '../audit/logger';
import {
  ProcurementDemandStatus,
  ProcurementDemandUrgency,
  ProcurementPurchaseOrderStatus,
  ProcurementQuoteStatus,
  ProcurementRequestStatus,
  inventoryLocations,
  products,
  procurementGoodsReceiptItems,
  procurementPurchaseRequests,
  procurementPurchaseOrderItems,
  procurementPurchaseOrders,
  procurementSupplierQuotes,
  procurementDemands,
  procurementFleetPolicies,
  stockLots,
  stockLotMovements,
  stockLevels,
  stockMovements,
  procurementSuppliers,
} from '@/db/schemas';
import {
  createProcurementDemandRepo,
  createProcurementDemandConsolidationItemsRepo,
  createProcurementDemandConsolidationRepo,
  createProcurementFleetPolicyRepo,
  createProcurementGoodsReceiptItemsRepo,
  createProcurementGoodsReceiptRepo,
  createProcurementPurchaseOrderItemsRepo,
  createProcurementPurchaseOrderRepo,
  createProcurementSupplierQuoteRepo,
  createProcurementSupplierRepo,
  createPurchaseRequestRepo,
  findProcurementFleetPolicyByBranchRepo,
  findOpenProcurementDemandByDedupeKeyRepo,
  findSupplierByNameRepo,
  getProcurementDemandsByIdsRepo,
  getProcurementPurchaseOrderByIdRepo,
  getProcurementSupplierQuoteByIdRepo,
  getProcurementFleetPolicyByIdRepo,
  getProcurementSupplierByIdRepo,
  getPurchaseRequestByIdRepo,
  listProcurementDemandConsolidationsRepo,
  listProcurementDemandsRepo,
  listProcurementFleetPoliciesRepo,
  listProcurementGoodsReceiptsRepo,
  listProcurementPurchaseOrderItemsRepo,
  listProcurementPurchaseOrdersRepo,
  listProcurementSupplierOptionsRepo,
  listProcurementSupplierQuotesRepo,
  listProcurementSuppliersRepo,
  listPurchaseRequestsRepo,
  updateProcurementDemandStatusRepo,
  updateProcurementPurchaseOrderRepo,
  updateProcurementSupplierQuoteRepo,
  updateProcurementFleetPolicyRepo,
  updateProcurementSupplierRepo,
  updatePurchaseRequestStatusRepo,
  type ListProcurementDemandConsolidationsParams,
  type ListProcurementDemandsParams,
  type ListProcurementFleetPoliciesParams,
  type ListProcurementGoodsReceiptsParams,
  type ListProcurementPurchaseOrdersParams,
  type ListPurchaseRequestsParams,
  type ListProcurementSupplierQuotesParams,
  type ListSuppliersParams,
} from './repository';
import { listFleetLowStockProcurementCandidatesRepo } from '../fleet-transport/repository';
import { db } from '@/db/config';
import { and, asc, eq, inArray, sql } from 'drizzle-orm';
import {
  autoFulfillStockRequestLineSvc,
  getStockRequestLineAllocationSvc,
  listStockRequestsSvc,
  retryOpenStockReservationsForProductSvc,
} from '../inventory/service';
import { listStockRequestLinesRepo } from '../inventory/repository';
import { StockLotStatus, StockRequestStatus, StockMovementType } from '@/db/schemas/enums';

function buildRequestNo() {
  return `PR-${Date.now().toString(36).toUpperCase()}`;
}

function buildDemandNo() {
  return `DM-${Date.now().toString(36).toUpperCase()}`;
}

function buildConsolidationNo() {
  return `CONS-${Date.now().toString(36).toUpperCase()}`;
}

function buildQuoteNo() {
  return `QT-${Date.now().toString(36).toUpperCase()}`;
}

function buildPoNo() {
  return `PO-${Date.now().toString(36).toUpperCase()}`;
}

function buildReceiptNo() {
  return `GRN-${Date.now().toString(36).toUpperCase()}`;
}

function parseDemandMetadata(value: string | null | undefined): Record<string, unknown> {
  if (!value?.trim()) return {};
  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed === 'object') return parsed as Record<string, unknown>;
  } catch {
    return {};
  }
  return {};
}

export async function listProcurementSuppliersSvc(params: ListSuppliersParams) {
  return listProcurementSuppliersRepo(params);
}

export async function listProcurementSupplierOptionsSvc(input: {
  companyId: string;
  search?: string | null;
  isActive?: boolean | null;
}) {
  return listProcurementSupplierOptionsRepo(input);
}

export async function getProcurementSupplierByIdSvc(input: { id: string; companyId: string }) {
  const row = await getProcurementSupplierByIdRepo(input.id, input.companyId);
  if (!row) throw NotFound('Supplier not found');
  return row;
}

export async function listProcurementFleetPoliciesSvc(params: ListProcurementFleetPoliciesParams) {
  return listProcurementFleetPoliciesRepo(params);
}

export async function getProcurementFleetPolicyByIdSvc(input: { companyId: string; id: string }) {
  const row = await getProcurementFleetPolicyByIdRepo(input.companyId, input.id);
  if (!row) throw NotFound('Fleet policy rule not found');
  return row;
}

export async function createProcurementFleetPolicySvc(input: {
  companyId: string;
  actorUserId: string;
  branchId?: string | null;
  preferredSupplierId?: string | null;
  demandUrgency?: number;
  replenishMultiplier?: number;
  isActive?: boolean;
  note?: string | null;
}) {
  const existing = await findProcurementFleetPolicyByBranchRepo(
    input.companyId,
    input.branchId ?? null,
  );
  if (existing) throw Conflict('A policy rule for this branch already exists');

  const demandUrgency = input.demandUrgency ?? ProcurementDemandUrgency.NORMAL;
  if (
    demandUrgency !== ProcurementDemandUrgency.LOW &&
    demandUrgency !== ProcurementDemandUrgency.NORMAL &&
    demandUrgency !== ProcurementDemandUrgency.HIGH &&
    demandUrgency !== ProcurementDemandUrgency.CRITICAL
  ) {
    throw Conflict('Unsupported demand urgency');
  }

  const replenishMultiplier = Math.max(1, Math.min(5, input.replenishMultiplier ?? 1));
  const created = await createProcurementFleetPolicyRepo({
    companyId: input.companyId,
    branchId: input.branchId ?? null,
    preferredSupplierId: input.preferredSupplierId ?? null,
    demandUrgency,
    replenishMultiplier,
    isActive: input.isActive ?? true,
    note: input.note ?? null,
    createdBy: input.actorUserId,
  });
  if (!created) throw Conflict('Failed to create fleet procurement policy rule');
  return created;
}

export async function updateProcurementFleetPolicySvc(input: {
  companyId: string;
  id: string;
  actorUserId: string;
  patch: {
    preferredSupplierId?: string | null;
    demandUrgency?: number;
    replenishMultiplier?: number;
    isActive?: boolean;
    note?: string | null;
  };
}) {
  if (typeof input.patch.demandUrgency === 'number') {
    const urgency = input.patch.demandUrgency;
    if (
      urgency !== ProcurementDemandUrgency.LOW &&
      urgency !== ProcurementDemandUrgency.NORMAL &&
      urgency !== ProcurementDemandUrgency.HIGH &&
      urgency !== ProcurementDemandUrgency.CRITICAL
    ) {
      throw Conflict('Unsupported demand urgency');
    }
  }

  const patch: Partial<typeof procurementFleetPolicies.$inferInsert> = {
    preferredSupplierId: input.patch.preferredSupplierId,
    demandUrgency: input.patch.demandUrgency,
    replenishMultiplier:
      typeof input.patch.replenishMultiplier === 'number'
        ? Math.max(1, Math.min(5, input.patch.replenishMultiplier))
        : undefined,
    isActive: input.patch.isActive,
    note: input.patch.note,
    updatedAt: new Date(),
  };

  const updated = await updateProcurementFleetPolicyRepo(input.companyId, input.id, patch);
  if (!updated) throw NotFound('Fleet policy rule not found');
  return updated;
}

export async function createProcurementSupplierSvc(input: {
  companyId: string;
  createdBy: string;
  name: string;
  contactPerson?: string | null;
  email?: string | null;
  telephone?: string | null;
  address?: string | null;
}) {
  const exists = await findSupplierByNameRepo(input.companyId, input.name);
  if (exists) throw Conflict('Supplier with this name already exists');

  const created = await createProcurementSupplierRepo({
    companyId: input.companyId,
    createdBy: input.createdBy,
    name: input.name,
    contactPerson: input.contactPerson ?? null,
    email: input.email ?? null,
    telephone: input.telephone ?? null,
    address: input.address ?? null,
  });
  if (!created) throw Conflict('Failed to create supplier');

  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.createdBy,
    entityType: 'procurement_supplier',
    entityId: created.id,
    action: 'PROCUREMENT_SUPPLIER_CREATED',
    message: `Supplier created: ${input.name}`,
  });

  return created;
}

export async function updateProcurementSupplierSvc(input: {
  id: string;
  companyId: string;
  actorUserId: string;
  patch: Partial<typeof procurementSuppliers.$inferInsert>;
}) {
  const updated = await updateProcurementSupplierRepo(input.id, input.companyId, input.patch);
  if (!updated) throw NotFound('Supplier not found');

  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.actorUserId,
    entityType: 'procurement_supplier',
    entityId: input.id,
    action: 'PROCUREMENT_SUPPLIER_UPDATED',
    message: 'Supplier updated',
    metadata: { patch: input.patch },
  });

  return updated;
}

export async function listPurchaseRequestsSvc(params: ListPurchaseRequestsParams) {
  return listPurchaseRequestsRepo(params);
}

export async function createPurchaseRequestSvc(input: {
  companyId: string;
  requestedByUserId: string;
  branchId?: string | null;
  supplierId?: string | null;
  title: string;
  description?: string | null;
  amountPsw: number;
}) {
  const created = await createPurchaseRequestRepo({
    companyId: input.companyId,
    requestNo: buildRequestNo(),
    branchId: input.branchId ?? null,
    supplierId: input.supplierId ?? null,
    title: input.title,
    description: input.description ?? null,
    amountPsw: input.amountPsw,
    status: ProcurementRequestStatus.SUBMITTED,
    requestedByUserId: input.requestedByUserId,
  });
  if (!created) throw Conflict('Failed to create purchase request');

  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.requestedByUserId,
    entityType: 'procurement_purchase_request',
    entityId: created.id,
    action: 'PROCUREMENT_PURCHASE_REQUEST_CREATED',
    message: `Purchase request created: ${input.title}`,
    metadata: { amountPsw: input.amountPsw },
  });

  return created;
}

export async function approvePurchaseRequestSvc(input: {
  id: string;
  companyId: string;
  approverUserId: string;
}) {
  const existing = await getPurchaseRequestByIdRepo(input.id, input.companyId);
  if (!existing) throw NotFound('Purchase request not found');
  if (existing.status !== ProcurementRequestStatus.SUBMITTED) {
    throw Conflict('Only submitted requests can be approved');
  }

  const updated = await updatePurchaseRequestStatusRepo(input.id, input.companyId, {
    status: ProcurementRequestStatus.APPROVED,
    approvedByUserId: input.approverUserId,
    approvedAt: new Date(),
    rejectedByUserId: null,
    rejectedAt: null,
    rejectionReason: null,
  } satisfies Partial<typeof procurementPurchaseRequests.$inferInsert>);

  if (!updated) throw NotFound('Purchase request not found');

  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.approverUserId,
    entityType: 'procurement_purchase_request',
    entityId: input.id,
    action: 'PROCUREMENT_PURCHASE_REQUEST_APPROVED',
    message: `Purchase request approved: ${existing.requestNo}`,
  });

  return updated;
}

export async function rejectPurchaseRequestSvc(input: {
  id: string;
  companyId: string;
  approverUserId: string;
  rejectionReason: string;
}) {
  const existing = await getPurchaseRequestByIdRepo(input.id, input.companyId);
  if (!existing) throw NotFound('Purchase request not found');
  if (existing.status !== ProcurementRequestStatus.SUBMITTED) {
    throw Conflict('Only submitted requests can be rejected');
  }

  const updated = await updatePurchaseRequestStatusRepo(input.id, input.companyId, {
    status: ProcurementRequestStatus.REJECTED,
    rejectedByUserId: input.approverUserId,
    rejectedAt: new Date(),
    rejectionReason: input.rejectionReason,
    approvedByUserId: null,
    approvedAt: null,
  } satisfies Partial<typeof procurementPurchaseRequests.$inferInsert>);

  if (!updated) throw NotFound('Purchase request not found');

  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.approverUserId,
    entityType: 'procurement_purchase_request',
    entityId: input.id,
    action: 'PROCUREMENT_PURCHASE_REQUEST_REJECTED',
    message: `Purchase request rejected: ${existing.requestNo}`,
    metadata: { rejectionReason: input.rejectionReason },
  });

  return updated;
}

export async function listProcurementDemandsSvc(params: ListProcurementDemandsParams) {
  return listProcurementDemandsRepo(params);
}

export async function createProcurementDemandSvc(input: {
  companyId: string;
  requestedByUserId: string;
  branchId?: string | null;
  sourceModule: string;
  sourceEntityType?: string | null;
  sourceEntityId?: string | null;
  dedupeKey?: string | null;
  itemCode: string;
  itemName: string;
  unit?: string | null;
  quantity: number;
  estimatedUnitCostPsw?: number;
  urgency?: number;
  neededBy?: Date | null;
  note?: string | null;
  metadataJson?: string | null;
}) {
  if (input.quantity <= 0) throw Conflict('Demand quantity must be greater than zero');
  const urgency = input.urgency ?? ProcurementDemandUrgency.NORMAL;
  if (
    urgency !== ProcurementDemandUrgency.LOW &&
    urgency !== ProcurementDemandUrgency.NORMAL &&
    urgency !== ProcurementDemandUrgency.HIGH &&
    urgency !== ProcurementDemandUrgency.CRITICAL
  ) {
    throw Conflict('Unsupported demand urgency');
  }

  const dedupeKey = input.dedupeKey?.trim() || null;
  if (dedupeKey) {
    const existing = await findOpenProcurementDemandByDedupeKeyRepo(input.companyId, dedupeKey);
    if (existing) {
      return existing;
    }
  }

  const estimatedUnitCostPsw = Math.max(0, Number(input.estimatedUnitCostPsw ?? 0));
  const estimatedTotalPsw = Math.max(0, estimatedUnitCostPsw * input.quantity);

  const created = await createProcurementDemandRepo({
    companyId: input.companyId,
    branchId: input.branchId ?? null,
    demandNo: buildDemandNo(),
    sourceModule: input.sourceModule.trim(),
    sourceEntityType: input.sourceEntityType?.trim() || null,
    sourceEntityId: input.sourceEntityId ?? null,
    dedupeKey,
    itemCode: input.itemCode.trim(),
    itemName: input.itemName.trim(),
    unit: input.unit?.trim() || 'unit',
    quantity: input.quantity,
    estimatedUnitCostPsw,
    estimatedTotalPsw,
    urgency,
    neededBy: input.neededBy ?? null,
    status: ProcurementDemandStatus.OPEN,
    note: input.note?.trim() || null,
    metadataJson: input.metadataJson ?? null,
    requestedByUserId: input.requestedByUserId,
  } satisfies typeof procurementDemands.$inferInsert);
  if (!created) throw Conflict('Failed to create procurement demand');

  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.requestedByUserId,
    entityType: 'procurement_demand',
    entityId: created.id,
    action: 'PROCUREMENT_DEMAND_CREATED',
    message: `Procurement demand created: ${input.itemCode} ${input.itemName}`,
    metadata: {
      sourceModule: input.sourceModule,
      sourceEntityType: input.sourceEntityType ?? null,
      sourceEntityId: input.sourceEntityId ?? null,
      quantity: input.quantity,
      estimatedTotalPsw,
    },
  });

  return created;
}

export async function createProcurementDemandsFromFleetLowStockSvc(input: {
  companyId: string;
  requestedByUserId: string;
  branchId?: string | null;
  limit?: number;
  replenishMultiplier?: number;
  usePolicyRules?: boolean;
}) {
  const limit = Math.max(1, Math.min(500, input.limit ?? 100));
  const defaultReplenishMultiplier = Math.max(1, Math.min(5, input.replenishMultiplier ?? 1));
  const candidates = await listFleetLowStockProcurementCandidatesRepo({
    companyId: input.companyId,
    branchId: input.branchId ?? null,
    limit,
  });

  const policies =
    input.usePolicyRules === false
      ? []
      : await listProcurementFleetPoliciesRepo({
          companyId: input.companyId,
          isActive: true,
        });
  const policyByBranch = new Map<string, (typeof policies)[number]>();
  let globalPolicy: (typeof policies)[number] | null = null;
  for (const policy of policies) {
    if (policy.branchId) {
      policyByBranch.set(policy.branchId, policy);
    } else if (!globalPolicy) {
      globalPolicy = policy;
    }
  }

  let created = 0;
  let deduped = 0;
  const demandNos: string[] = [];
  for (const item of candidates) {
    const policy = (item.branchId ? policyByBranch.get(item.branchId) : undefined) ?? globalPolicy;
    const replenishMultiplier =
      typeof input.replenishMultiplier === 'number'
        ? defaultReplenishMultiplier
        : Math.max(1, Math.min(5, policy?.replenishMultiplier ?? defaultReplenishMultiplier));
    const quantity = Math.max(1, Math.ceil(item.suggestedQty * replenishMultiplier));
    const dedupeKey = `fleet_low_stock:${item.partId}:${item.branchId ?? 'none'}`;
    const existing = await findOpenProcurementDemandByDedupeKeyRepo(input.companyId, dedupeKey);
    if (existing) {
      deduped += 1;
      demandNos.push(existing.demandNo);
      continue;
    }

    const demand = await createProcurementDemandSvc({
      companyId: input.companyId,
      requestedByUserId: input.requestedByUserId,
      branchId: item.branchId ?? null,
      sourceModule: 'fleet_transport',
      sourceEntityType: 'fleet_maintenance_part',
      sourceEntityId: item.partId,
      dedupeKey,
      itemCode: item.sku,
      itemName: item.name,
      unit: item.unit,
      quantity,
      estimatedUnitCostPsw: item.averageUnitCostPsw,
      urgency: policy?.demandUrgency ?? ProcurementDemandUrgency.NORMAL,
      note: `Auto-created from fleet low-stock candidate (qty_on_hand=${item.qtyOnHand}, reorder=${item.reorderLevel}).`,
      metadataJson: JSON.stringify({
        source: 'fleet_low_stock',
        partId: item.partId,
        qtyOnHand: item.qtyOnHand,
        reorderLevel: item.reorderLevel,
        replenishMultiplier,
        procurementPolicyId: policy?.id ?? null,
        preferredSupplierId: policy?.preferredSupplierId ?? null,
      }),
    });
    if (demand?.demandNo) demandNos.push(demand.demandNo);
    created += 1;
  }

  return {
    candidates: candidates.length,
    created,
    deduped,
    demandNos,
  };
}

export async function convertProcurementDemandsToPurchaseRequestsSvc(input: {
  companyId: string;
  actorUserId: string;
  demandIds: string[];
  supplierId?: string | null;
}) {
  const normalizedIds = [...new Set(input.demandIds.map((id) => id.trim()).filter(Boolean))];
  if (!normalizedIds.length) throw Conflict('Select at least one demand');

  const rows = await getProcurementDemandsByIdsRepo(input.companyId, normalizedIds);
  if (!rows.length) throw NotFound('No demands found');
  if (rows.length !== normalizedIds.length) throw NotFound('Some demands were not found');

  const blocked = rows.find((row) => row.status !== ProcurementDemandStatus.OPEN);
  if (blocked) {
    throw Conflict(`Only open demands can be converted. Blocked demand: ${blocked.demandNo}`);
  }

  const requestIds: string[] = [];
  for (const row of rows) {
    const metadata = parseDemandMetadata(row.metadataJson);
    const preferredSupplierIdFromDemand =
      typeof metadata.preferredSupplierId === 'string' && metadata.preferredSupplierId.trim()
        ? metadata.preferredSupplierId.trim()
        : null;
    const resolvedSupplierId = input.supplierId ?? preferredSupplierIdFromDemand ?? null;

    const title = `Demand conversion: ${row.itemCode} ${row.itemName}`;
    const description = [
      `Converted from demand ${row.demandNo}.`,
      `Qty ${row.quantity} ${row.unit}.`,
      `Estimated unit ${row.estimatedUnitCostPsw}.`,
    ].join(' ');
    const amountPsw = Math.max(0, row.estimatedTotalPsw);

    const created = await createPurchaseRequestRepo({
      companyId: input.companyId,
      requestNo: buildRequestNo(),
      branchId: row.branchId ?? null,
      supplierId: resolvedSupplierId,
      title,
      description,
      amountPsw,
      status: ProcurementRequestStatus.SUBMITTED,
      requestedByUserId: input.actorUserId,
    });
    if (!created) throw Conflict(`Failed to convert demand ${row.demandNo}`);

    await updateProcurementDemandStatusRepo(input.companyId, row.id, {
      status: ProcurementDemandStatus.CONVERTED_TO_REQUEST,
      note: `Converted to purchase request by ${input.actorUserId}`,
    } satisfies Partial<typeof procurementDemands.$inferInsert>);

    requestIds.push(created.id);
  }

  await recordAuditLog({
    companyId: input.companyId,
    actorUserId: input.actorUserId,
    entityType: 'procurement_demand',
    entityId: input.companyId,
    action: 'PROCUREMENT_DEMANDS_CONVERTED_TO_PURCHASE_REQUESTS',
    message: 'Procurement demands converted to purchase requests',
    metadata: {
      convertedCount: rows.length,
      supplierId: input.supplierId ?? null,
      demandIds: normalizedIds,
    },
  });

  return {
    converted: rows.length,
    requestIds,
  };
}

export async function createProcurementDemandsFromInventoryLowStockSvc(input: {
  companyId: string;
  requestedByUserId: string;
  rootLocationId?: string | null;
  targetMainStoreLocationId?: string | null;
  lowStockLimit?: number;
}) {
  const limit = Math.max(1, Math.min(500, input.lowStockLimit ?? 200));
  const locations = input.rootLocationId
    ? await db.execute(sql`
        WITH RECURSIVE location_tree AS (
          SELECT id, parent_location_id
          FROM inventory_locations
          WHERE id = ${input.rootLocationId}
            AND company_id = ${input.companyId}
            AND is_deleted = false
          UNION ALL
          SELECT child.id, child.parent_location_id
          FROM inventory_locations child
          INNER JOIN location_tree parent ON child.parent_location_id = parent.id
          WHERE child.company_id = ${input.companyId}
            AND child.is_deleted = false
        )
        SELECT id FROM location_tree
      `)
    : await db
        .select({ id: inventoryLocations.id })
        .from(inventoryLocations)
        .where(
          and(
            eq(inventoryLocations.companyId, input.companyId),
            eq(inventoryLocations.isDeleted, false),
          ),
        );

  const locationIds = (
    Array.isArray(locations)
      ? locations.map((r) => r.id)
      : Array.from(locations as Iterable<{ id: string }>).map((r) => r.id)
  ) as string[];
  if (!locationIds.length) return { scanned: 0, created: 0, deduped: 0, demandNos: [] as string[] };

  const balances = await db
    .select({
      productId: products.id,
      productName: products.name,
      productSku: products.sku,
      minStockLevel: products.minStockLevel,
      quantity: sql<number>`coalesce(sum(${stockLevels.quantity}), 0)`,
    })
    .from(products)
    .leftJoin(
      stockLevels,
      and(
        eq(stockLevels.productId, products.id),
        eq(stockLevels.companyId, input.companyId),
        inArray(stockLevels.locationId, locationIds),
      ),
    )
    .where(and(eq(products.companyId, input.companyId), eq(products.isDeleted, false)))
    .groupBy(products.id)
    .orderBy(asc(products.name))
    .limit(limit);

  let created = 0;
  let deduped = 0;
  const demandNos: string[] = [];
  const lowRows = balances.filter((row) => Number(row.quantity) < Number(row.minStockLevel ?? 0));
  for (const row of lowRows) {
    const gap = Math.max(0, Number(row.minStockLevel ?? 0) - Number(row.quantity ?? 0));
    if (gap <= 0) continue;
    const dedupeKey = `inventory_low_stock:${row.productId}:${input.rootLocationId ?? 'all'}`;
    const existing = await findOpenProcurementDemandByDedupeKeyRepo(input.companyId, dedupeKey);
    if (existing) {
      deduped += 1;
      demandNos.push(existing.demandNo);
      continue;
    }

    const demand = await createProcurementDemandSvc({
      companyId: input.companyId,
      requestedByUserId: input.requestedByUserId,
      branchId: null,
      sourceModule: 'inventory',
      sourceEntityType: 'product',
      sourceEntityId: row.productId,
      dedupeKey,
      itemCode: row.productSku,
      itemName: row.productName,
      unit: 'base-unit',
      quantity: gap,
      estimatedUnitCostPsw: 0,
      urgency: ProcurementDemandUrgency.NORMAL,
      note: `Auto-created from inventory low stock signal`,
      metadataJson: JSON.stringify({
        source: 'inventory_low_stock',
        productId: row.productId,
        minStockLevel: Number(row.minStockLevel ?? 0),
        currentQty: Number(row.quantity ?? 0),
        targetMainStoreLocationId: input.targetMainStoreLocationId ?? null,
      }),
    });
    created += 1;
    demandNos.push(demand.demandNo);
  }

  return {
    scanned: lowRows.length,
    created,
    deduped,
    demandNos,
  };
}

export async function consolidateProcurementDemandsSvc(input: {
  companyId: string;
  actorUserId: string;
  demandIds: string[];
  sourceRootLocationId?: string | null;
  targetMainStoreLocationId?: string | null;
  note?: string | null;
}) {
  const normalizedIds = [...new Set(input.demandIds.map((id) => id.trim()).filter(Boolean))];
  if (!normalizedIds.length) throw Conflict('Select at least one demand to consolidate');

  const rows = await getProcurementDemandsByIdsRepo(input.companyId, normalizedIds);
  if (!rows.length) throw NotFound('No demands found');
  if (rows.length !== normalizedIds.length) throw NotFound('Some demands were not found');
  const blocked = rows.find((row) => row.status !== ProcurementDemandStatus.OPEN);
  if (blocked)
    throw Conflict(`Only open demands can be consolidated. Blocked: ${blocked.demandNo}`);

  const created = await createProcurementDemandConsolidationRepo({
    companyId: input.companyId,
    consolidationNo: buildConsolidationNo(),
    sourceRootLocationId: input.sourceRootLocationId ?? null,
    targetMainStoreLocationId: input.targetMainStoreLocationId ?? null,
    note: input.note ?? null,
    createdBy: input.actorUserId,
  });
  if (!created) throw Conflict('Failed to create consolidation batch');

  await createProcurementDemandConsolidationItemsRepo(
    rows.map((row) => ({
      consolidationId: created.id,
      demandId: row.id,
    })),
  );

  for (const row of rows) {
    await updateProcurementDemandStatusRepo(input.companyId, row.id, {
      status: ProcurementDemandStatus.CONSOLIDATED,
      note: `Consolidated into ${created.consolidationNo}`,
    } satisfies Partial<typeof procurementDemands.$inferInsert>);
  }

  return { id: created.id, consolidationNo: created.consolidationNo, consolidated: rows.length };
}

export async function listProcurementDemandConsolidationsSvc(
  params: ListProcurementDemandConsolidationsParams,
) {
  return listProcurementDemandConsolidationsRepo(params);
}

export async function approveProcurementDemandSvc(input: {
  companyId: string;
  id: string;
  approverUserId: string;
}) {
  const rows = await getProcurementDemandsByIdsRepo(input.companyId, [input.id]);
  const row = rows[0];
  if (!row) throw NotFound('Demand not found');
  if (
    row.status !== ProcurementDemandStatus.OPEN &&
    row.status !== ProcurementDemandStatus.CONSOLIDATED
  ) {
    throw Conflict('Only open or consolidated demands can be approved');
  }
  const updated = await updateProcurementDemandStatusRepo(input.companyId, input.id, {
    status: ProcurementDemandStatus.APPROVED,
    approvedByUserId: input.approverUserId,
    approvedAt: new Date(),
    rejectedByUserId: null,
    rejectedAt: null,
    rejectionReason: null,
  } satisfies Partial<typeof procurementDemands.$inferInsert>);
  if (!updated) throw NotFound('Demand not found');
  return updated;
}

export async function rejectProcurementDemandSvc(input: {
  companyId: string;
  id: string;
  approverUserId: string;
  rejectionReason: string;
}) {
  const rows = await getProcurementDemandsByIdsRepo(input.companyId, [input.id]);
  const row = rows[0];
  if (!row) throw NotFound('Demand not found');
  if (
    row.status !== ProcurementDemandStatus.OPEN &&
    row.status !== ProcurementDemandStatus.CONSOLIDATED
  ) {
    throw Conflict('Only open or consolidated demands can be rejected');
  }
  const updated = await updateProcurementDemandStatusRepo(input.companyId, input.id, {
    status: ProcurementDemandStatus.CANCELLED,
    rejectedByUserId: input.approverUserId,
    rejectedAt: new Date(),
    rejectionReason: input.rejectionReason,
  } satisfies Partial<typeof procurementDemands.$inferInsert>);
  if (!updated) throw NotFound('Demand not found');
  return updated;
}

export async function listProcurementSupplierQuotesSvc(
  params: ListProcurementSupplierQuotesParams,
) {
  return listProcurementSupplierQuotesRepo(params);
}

export async function createProcurementSupplierQuoteSvc(input: {
  companyId: string;
  createdBy: string;
  demandId: string;
  supplierId: string;
  quantity: number;
  unitCostPsw: number;
  note?: string | null;
}) {
  const demandRows = await getProcurementDemandsByIdsRepo(input.companyId, [input.demandId]);
  if (!demandRows[0]) throw NotFound('Demand not found');
  const totalCostPsw = Math.max(0, input.quantity * input.unitCostPsw);
  const created = await createProcurementSupplierQuoteRepo({
    companyId: input.companyId,
    demandId: input.demandId,
    supplierId: input.supplierId,
    quoteNo: buildQuoteNo(),
    quantity: Math.max(0, input.quantity),
    unitCostPsw: Math.max(0, input.unitCostPsw),
    totalCostPsw,
    status: ProcurementQuoteStatus.SUBMITTED,
    note: input.note ?? null,
    createdBy: input.createdBy,
  });
  if (!created) throw Conflict('Failed to create supplier quote');
  return created;
}

export async function acceptProcurementSupplierQuoteSvc(input: {
  companyId: string;
  id: string;
  actorUserId: string;
}) {
  const quote = await getProcurementSupplierQuoteByIdRepo(input.companyId, input.id);
  if (!quote) throw NotFound('Supplier quote not found');
  const updated = await updateProcurementSupplierQuoteRepo(input.companyId, input.id, {
    status: ProcurementQuoteStatus.ACCEPTED,
  } satisfies Partial<typeof procurementSupplierQuotes.$inferInsert>);
  if (!updated) throw NotFound('Supplier quote not found');
  return updated;
}

export async function createProcurementPurchaseOrderFromAcceptedQuotesSvc(input: {
  companyId: string;
  actorUserId: string;
  quoteIds: string[];
  note?: string | null;
}) {
  const quoteIds = [...new Set(input.quoteIds.map((id) => id.trim()).filter(Boolean))];
  if (!quoteIds.length) throw Conflict('Select at least one accepted quote');

  const quotes = await Promise.all(
    quoteIds.map((id) => getProcurementSupplierQuoteByIdRepo(input.companyId, id)),
  );
  const rows = quotes.filter(Boolean) as NonNullable<(typeof quotes)[number]>[];
  if (!rows.length || rows.length !== quoteIds.length) throw NotFound('Some quotes were not found');
  const blocked = rows.find((row) => row.status !== ProcurementQuoteStatus.ACCEPTED);
  if (blocked)
    throw Conflict(
      `Only accepted quotes can be converted to PO. Blocked quote: ${blocked.quoteNo}`,
    );

  const supplierId = rows[0].supplierId;
  const mixed = rows.find((row) => row.supplierId !== supplierId);
  if (mixed) throw Conflict('All selected quotes must belong to the same supplier');

  const created = await createProcurementPurchaseOrderRepo({
    companyId: input.companyId,
    purchaseRequestId: null,
    supplierId,
    poNo: buildPoNo(),
    status: ProcurementPurchaseOrderStatus.OPEN,
    note: input.note ?? null,
    createdBy: input.actorUserId,
  });
  if (!created) throw Conflict('Failed to create purchase order');

  const demandRows = await getProcurementDemandsByIdsRepo(
    input.companyId,
    rows.map((row) => row.demandId),
  );
  const demandById = new Map(demandRows.map((row) => [row.id, row] as const));

  await createProcurementPurchaseOrderItemsRepo(
    rows.map((row) => {
      const demand = demandById.get(row.demandId);
      return {
        purchaseOrderId: created.id,
        demandId: row.demandId,
        productId:
          (parseDemandMetadata(demand?.metadataJson).productId as string | undefined) ?? null,
        locationId:
          (parseDemandMetadata(demand?.metadataJson).targetMainStoreLocationId as
            | string
            | undefined) ?? null,
        itemCode: demand?.itemCode ?? 'item',
        itemName: demand?.itemName ?? 'item',
        unit: demand?.unit ?? 'unit',
        orderedQuantity: row.quantity,
        receivedQuantity: 0,
        backorderQuantity: row.quantity,
        unitCostPsw: row.unitCostPsw,
      } satisfies typeof procurementPurchaseOrderItems.$inferInsert;
    }),
  );

  return { id: created.id, poNo: created.poNo };
}

export async function listProcurementPurchaseOrdersSvc(
  params: ListProcurementPurchaseOrdersParams,
) {
  return listProcurementPurchaseOrdersRepo(params);
}

export async function listProcurementGoodsReceiptsSvc(params: ListProcurementGoodsReceiptsParams) {
  return listProcurementGoodsReceiptsRepo(params);
}

export async function createProcurementGoodsReceiptSvc(input: {
  companyId: string;
  actorUserId: string;
  purchaseOrderId: string;
  note?: string | null;
  lines: {
    purchaseOrderItemId: string;
    receivedQuantity: number;
    locationId?: string | null;
    batchNumber?: string | null;
    supplierBatchNumber?: string | null;
    manufacturedAt?: Date | null;
    expiryDate?: Date | null;
  }[];
}) {
  const po = await getProcurementPurchaseOrderByIdRepo(input.companyId, input.purchaseOrderId);
  if (!po) throw NotFound('Purchase order not found');
  if (
    po.status === ProcurementPurchaseOrderStatus.CANCELLED ||
    po.status === ProcurementPurchaseOrderStatus.RECEIVED
  ) {
    throw Conflict('Purchase order cannot receive more goods');
  }
  if (!input.lines.length) throw Conflict('Provide at least one receipt line');

  const poItems = await listProcurementPurchaseOrderItemsRepo(input.purchaseOrderId);
  const poItemById = new Map(poItems.map((row) => [row.id, row] as const));

  const created = await createProcurementGoodsReceiptRepo({
    companyId: input.companyId,
    purchaseOrderId: input.purchaseOrderId,
    receiptNo: buildReceiptNo(),
    note: input.note ?? null,
    receivedBy: input.actorUserId,
  });
  if (!created) throw Conflict('Failed to create goods receipt');

  const receiptItems: (typeof procurementGoodsReceiptItems.$inferInsert)[] = [];
  for (const line of input.lines) {
    const item = poItemById.get(line.purchaseOrderItemId);
    if (!item) throw NotFound(`Purchase order item not found: ${line.purchaseOrderItemId}`);
    if (!Number.isInteger(line.receivedQuantity) || line.receivedQuantity <= 0) {
      throw Conflict('Received quantity must be a positive integer');
    }
    const remaining = Number(item.orderedQuantity) - Number(item.receivedQuantity);
    if (line.receivedQuantity > remaining) {
      throw Conflict(`Received quantity exceeds remaining quantity for item ${item.id}`);
    }
    const locationId = line.locationId ?? item.locationId;
    if (!locationId) throw Conflict(`Missing destination location for item ${item.id}`);

    const normalizedBatchNumber =
      line.batchNumber?.trim() ||
      `${created.receiptNo}-${item.itemCode || 'ITEM'}-${receiptItems.length + 1}`;

    receiptItems.push({
      goodsReceiptId: created.id,
      purchaseOrderItemId: item.id,
      receivedQuantity: line.receivedQuantity,
      locationId,
      batchNumber: normalizedBatchNumber,
      supplierBatchNumber: line.supplierBatchNumber?.trim() || null,
      manufacturedAt: line.manufacturedAt ?? null,
      expiryDate: line.expiryDate ?? null,
    });
  }

  await db.transaction(async (tx) => {
    for (const receipt of receiptItems) {
      const poItem = poItemById.get(receipt.purchaseOrderItemId)!;
      const nextReceived = Number(poItem.receivedQuantity) + Number(receipt.receivedQuantity);
      const nextBackorder = Math.max(0, Number(poItem.orderedQuantity) - nextReceived);
      await tx
        .update(procurementPurchaseOrderItems)
        .set({
          receivedQuantity: nextReceived,
          backorderQuantity: nextBackorder,
          updatedAt: new Date(),
        })
        .where(eq(procurementPurchaseOrderItems.id, poItem.id));

      if (poItem.productId && receipt.locationId) {
        const currentLevel = await tx
          .select({ quantity: stockLevels.quantity })
          .from(stockLevels)
          .where(
            and(
              eq(stockLevels.companyId, input.companyId),
              eq(stockLevels.productId, poItem.productId),
              eq(stockLevels.locationId, receipt.locationId),
            ),
          )
          .limit(1);
        const currentQty = Number(currentLevel[0]?.quantity ?? 0);
        const receivedQty = Number(receipt.receivedQuantity);
        const batchNumber =
          receipt.batchNumber?.trim() || `${created.receiptNo}-${poItem.itemCode || 'ITEM'}`;

        const existingLotRows = await tx
          .select({
            id: stockLots.id,
            quantityOnHand: stockLots.quantityOnHand,
            reservedQuantity: stockLots.reservedQuantity,
            expiryDate: stockLots.expiryDate,
            manufacturedAt: stockLots.manufacturedAt,
            supplierBatchNumber: stockLots.supplierBatchNumber,
          })
          .from(stockLots)
          .where(
            and(
              eq(stockLots.companyId, input.companyId),
              eq(stockLots.productId, poItem.productId),
              eq(stockLots.locationId, receipt.locationId),
              sql`lower(${stockLots.batchNumber}) = lower(${batchNumber})`,
            ),
          )
          .limit(1);
        const existingLot = existingLotRows[0];

        let lotId = existingLot?.id ?? null;
        if (existingLot) {
          await tx
            .update(stockLots)
            .set({
              quantityOnHand: Number(existingLot.quantityOnHand ?? 0) + receivedQty,
              status: StockLotStatus.ACTIVE,
              supplierBatchNumber:
                receipt.supplierBatchNumber ?? existingLot.supplierBatchNumber ?? null,
              manufacturedAt: receipt.manufacturedAt ?? existingLot.manufacturedAt ?? null,
              expiryDate: receipt.expiryDate ?? existingLot.expiryDate ?? null,
              updatedAt: new Date(),
            })
            .where(eq(stockLots.id, existingLot.id));
        } else {
          const insertedLot = await tx
            .insert(stockLots)
            .values({
              companyId: input.companyId,
              productId: poItem.productId,
              locationId: receipt.locationId,
              batchNumber,
              supplierBatchNumber: receipt.supplierBatchNumber ?? null,
              receivedAt: new Date(),
              manufacturedAt: receipt.manufacturedAt ?? null,
              expiryDate: receipt.expiryDate ?? null,
              quantityOnHand: receivedQty,
              reservedQuantity: 0,
              status: StockLotStatus.ACTIVE,
              notes: input.note ?? po.note ?? null,
              createdBy: input.actorUserId,
            })
            .returning({ id: stockLots.id });
          lotId = insertedLot[0]?.id ?? null;
        }

        await tx.insert(stockMovements).values({
          companyId: input.companyId,
          productId: poItem.productId,
          locationId: receipt.locationId,
          movementType: StockMovementType.RECEIPT,
          lotId,
          quantity: receivedQty,
          referenceId: created.id,
          referenceType: 'procurement_goods_receipt',
          notes: input.note ?? po.note,
          createdBy: input.actorUserId,
        });

        if (lotId) {
          await tx.insert(stockLotMovements).values({
            companyId: input.companyId,
            lotId,
            productId: poItem.productId,
            locationId: receipt.locationId,
            movementType: StockMovementType.RECEIPT,
            quantity: receivedQty,
            referenceId: created.id,
            referenceType: 'procurement_goods_receipt',
            notes: input.note ?? po.note ?? null,
            createdBy: input.actorUserId,
          });
        }
        receipt.lotId = lotId;

        await tx
          .insert(stockLevels)
          .values({
            companyId: input.companyId,
            productId: poItem.productId,
            locationId: receipt.locationId,
            quantity: currentQty + receivedQty,
          })
          .onConflictDoUpdate({
            target: [stockLevels.productId, stockLevels.locationId],
            set: {
              quantity: currentQty + receivedQty,
              updatedAt: new Date(),
            },
          });
      }
    }
  });

  await createProcurementGoodsReceiptItemsRepo(receiptItems);

  const refreshedItems = await listProcurementPurchaseOrderItemsRepo(input.purchaseOrderId);
  const totalOrdered = refreshedItems.reduce((sum, row) => sum + Number(row.orderedQuantity), 0);
  const totalReceived = refreshedItems.reduce((sum, row) => sum + Number(row.receivedQuantity), 0);
  const nextStatus =
    totalReceived >= totalOrdered
      ? ProcurementPurchaseOrderStatus.RECEIVED
      : totalReceived > 0
        ? ProcurementPurchaseOrderStatus.PARTIALLY_RECEIVED
        : ProcurementPurchaseOrderStatus.OPEN;
  await updateProcurementPurchaseOrderRepo(input.companyId, input.purchaseOrderId, {
    status: nextStatus,
  } satisfies Partial<typeof procurementPurchaseOrders.$inferInsert>);

  // Backorder progression + auto closure of outstanding stock request gaps from received location.
  for (const receipt of receiptItems) {
    const poItem = poItemById.get(receipt.purchaseOrderItemId)!;
    if (!poItem.productId || !receipt.locationId) continue;
    const requests = await listStockRequestsSvc({
      limit: 200,
      offset: 0,
      companyId: input.companyId,
      status: StockRequestStatus.PARTIALLY_FULFILLED,
    });
    for (const req of requests.data) {
      const lines = await listStockRequestLinesRepo(req.id);
      const line = lines.find(
        (row) =>
          row.productId === poItem.productId &&
          Number(row.fulfilledQuantity) < Number(row.requestedQuantity),
      );
      if (!line) continue;
      const allocation = await getStockRequestLineAllocationSvc({
        requestId: req.id,
        lineId: line.id,
      });
      const firstCandidate = allocation.candidates.find((c) => c.locationId === receipt.locationId);
      if (!firstCandidate || firstCandidate.availableQuantity <= 0) continue;
      await autoFulfillStockRequestLineSvc({
        requestId: req.id,
        lineId: line.id,
        fulfilledBy: input.actorUserId,
        notes: 'Auto-fulfilled after procurement goods receipt',
      });
    }
  }

  const replenishedProducts = new Set<string>();
  for (const receipt of receiptItems) {
    const poItem = poItemById.get(receipt.purchaseOrderItemId);
    if (!poItem?.productId) continue;
    replenishedProducts.add(poItem.productId);
  }
  for (const productId of replenishedProducts) {
    await retryOpenStockReservationsForProductSvc({
      companyId: input.companyId,
      productId,
      actorUserId: input.actorUserId,
    });
  }

  return { id: created.id, receiptNo: created.receiptNo };
}
