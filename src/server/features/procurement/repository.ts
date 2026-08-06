import { and, asc, count, desc, eq, ilike, inArray, isNull, or } from 'drizzle-orm';
import { db } from '@/db/config';
import {
  procurementDemandConsolidationItems,
  procurementDemandConsolidations,
  procurementDemands,
  procurementFleetPolicies,
  procurementGoodsReceiptItems,
  procurementGoodsReceipts,
  procurementPurchaseOrderItems,
  procurementPurchaseOrders,
  procurementPurchaseRequests,
  procurementSupplierQuotes,
  procurementSuppliers,
  users,
} from '@/db/schemas';

export type ListSuppliersParams = {
  companyId: string;
  limit: number;
  offset: number;
  search?: string | null;
  isActive?: boolean | null;
};

export type ListPurchaseRequestsParams = {
  companyId: string;
  limit: number;
  offset: number;
  search?: string | null;
  status?: number | null;
  supplierId?: string | null;
  pendingOnly?: boolean | null;
};

export type ListProcurementDemandsParams = {
  companyId: string;
  limit: number;
  offset: number;
  search?: string | null;
  status?: number | null;
  sourceModule?: string | null;
  branchId?: string | null;
};

export type ListProcurementFleetPoliciesParams = {
  companyId: string;
  isActive?: boolean | null;
  branchId?: string | null;
};

export async function listProcurementSuppliersRepo(params: ListSuppliersParams) {
  const where = [eq(procurementSuppliers.companyId, params.companyId)];
  if (params.search?.trim()) {
    const q = `%${params.search.trim()}%`;
    where.push(
      or(
        ilike(procurementSuppliers.name, q),
        ilike(procurementSuppliers.contactPerson, q),
        ilike(procurementSuppliers.email, q),
        ilike(procurementSuppliers.telephone, q),
      )!,
    );
  }
  if (typeof params.isActive === 'boolean') {
    where.push(eq(procurementSuppliers.isActive, params.isActive));
  }

  const [countRow] = await db
    .select({ c: count() })
    .from(procurementSuppliers)
    .where(and(...where));

  const rows = await db
    .select({
      id: procurementSuppliers.id,
      name: procurementSuppliers.name,
      contactPerson: procurementSuppliers.contactPerson,
      email: procurementSuppliers.email,
      telephone: procurementSuppliers.telephone,
      address: procurementSuppliers.address,
      isActive: procurementSuppliers.isActive,
      createdAt: procurementSuppliers.createdAt,
      updatedAt: procurementSuppliers.updatedAt,
    })
    .from(procurementSuppliers)
    .where(and(...where))
    .orderBy(asc(procurementSuppliers.name), asc(procurementSuppliers.id))
    .limit(params.limit)
    .offset(params.offset);

  return {
    data: rows,
    totalRecords: Number((countRow?.c as unknown as bigint) ?? 0n),
  };
}

export async function listProcurementSupplierOptionsRepo(params: {
  companyId: string;
  search?: string | null;
  isActive?: boolean | null;
}) {
  const where = [eq(procurementSuppliers.companyId, params.companyId)];
  if (params.search?.trim()) {
    const q = `%${params.search.trim()}%`;
    where.push(
      or(
        ilike(procurementSuppliers.name, q),
        ilike(procurementSuppliers.contactPerson, q),
        ilike(procurementSuppliers.email, q),
      )!,
    );
  }
  if (typeof params.isActive === 'boolean') {
    where.push(eq(procurementSuppliers.isActive, params.isActive));
  }

  return db
    .select({
      id: procurementSuppliers.id,
      name: procurementSuppliers.name,
      isActive: procurementSuppliers.isActive,
    })
    .from(procurementSuppliers)
    .where(and(...where))
    .orderBy(asc(procurementSuppliers.name), asc(procurementSuppliers.id));
}

export async function getProcurementSupplierByIdRepo(id: string, companyId: string) {
  const [row] = await db
    .select({
      id: procurementSuppliers.id,
      name: procurementSuppliers.name,
      contactPerson: procurementSuppliers.contactPerson,
      email: procurementSuppliers.email,
      telephone: procurementSuppliers.telephone,
      address: procurementSuppliers.address,
      isActive: procurementSuppliers.isActive,
      createdAt: procurementSuppliers.createdAt,
      updatedAt: procurementSuppliers.updatedAt,
    })
    .from(procurementSuppliers)
    .where(and(eq(procurementSuppliers.id, id), eq(procurementSuppliers.companyId, companyId)))
    .limit(1);
  return row ?? null;
}

export async function createProcurementSupplierRepo(
  values: typeof procurementSuppliers.$inferInsert,
) {
  const [row] = await db
    .insert(procurementSuppliers)
    .values(values)
    .returning({ id: procurementSuppliers.id });
  return row;
}

export async function findSupplierByNameRepo(companyId: string, name: string) {
  const [row] = await db
    .select({ id: procurementSuppliers.id, isActive: procurementSuppliers.isActive })
    .from(procurementSuppliers)
    .where(
      and(eq(procurementSuppliers.companyId, companyId), ilike(procurementSuppliers.name, name)),
    )
    .limit(1);
  return row ?? null;
}

export async function updateProcurementSupplierRepo(
  id: string,
  companyId: string,
  patch: Partial<typeof procurementSuppliers.$inferInsert>,
) {
  const [row] = await db
    .update(procurementSuppliers)
    .set(patch)
    .where(and(eq(procurementSuppliers.id, id), eq(procurementSuppliers.companyId, companyId)))
    .returning({ id: procurementSuppliers.id });
  return row ?? null;
}

export async function createPurchaseRequestRepo(
  values: typeof procurementPurchaseRequests.$inferInsert,
) {
  const [row] = await db
    .insert(procurementPurchaseRequests)
    .values(values)
    .returning({ id: procurementPurchaseRequests.id });
  return row;
}

export async function listPurchaseRequestsRepo(params: ListPurchaseRequestsParams) {
  const where = [eq(procurementPurchaseRequests.companyId, params.companyId)];
  if (params.search?.trim()) {
    const q = `%${params.search.trim()}%`;
    where.push(
      or(
        ilike(procurementPurchaseRequests.requestNo, q),
        ilike(procurementPurchaseRequests.title, q),
        ilike(procurementPurchaseRequests.description, q),
      )!,
    );
  }
  if (typeof params.status === 'number') {
    where.push(eq(procurementPurchaseRequests.status, params.status));
  }
  if (params.supplierId) {
    where.push(eq(procurementPurchaseRequests.supplierId, params.supplierId));
  }
  if (params.pendingOnly) {
    where.push(eq(procurementPurchaseRequests.status, 1));
  }

  const [countRow] = await db
    .select({ c: count() })
    .from(procurementPurchaseRequests)
    .where(and(...where));

  const rows = await db
    .select({
      id: procurementPurchaseRequests.id,
      requestNo: procurementPurchaseRequests.requestNo,
      title: procurementPurchaseRequests.title,
      description: procurementPurchaseRequests.description,
      amountPsw: procurementPurchaseRequests.amountPsw,
      status: procurementPurchaseRequests.status,
      supplierId: procurementPurchaseRequests.supplierId,
      supplierName: procurementSuppliers.name,
      requestedByUserId: procurementPurchaseRequests.requestedByUserId,
      requestedByName: users.fullname,
      approvedByUserId: procurementPurchaseRequests.approvedByUserId,
      rejectedByUserId: procurementPurchaseRequests.rejectedByUserId,
      rejectionReason: procurementPurchaseRequests.rejectionReason,
      approvedAt: procurementPurchaseRequests.approvedAt,
      rejectedAt: procurementPurchaseRequests.rejectedAt,
      createdAt: procurementPurchaseRequests.createdAt,
      updatedAt: procurementPurchaseRequests.updatedAt,
    })
    .from(procurementPurchaseRequests)
    .leftJoin(
      procurementSuppliers,
      eq(procurementSuppliers.id, procurementPurchaseRequests.supplierId),
    )
    .leftJoin(users, eq(users.id, procurementPurchaseRequests.requestedByUserId))
    .where(and(...where))
    .orderBy(desc(procurementPurchaseRequests.createdAt), desc(procurementPurchaseRequests.id))
    .limit(params.limit)
    .offset(params.offset);

  return {
    data: rows,
    totalRecords: Number((countRow?.c as unknown as bigint) ?? 0n),
  };
}

export async function getPurchaseRequestByIdRepo(id: string, companyId: string) {
  const [row] = await db
    .select({
      id: procurementPurchaseRequests.id,
      requestNo: procurementPurchaseRequests.requestNo,
      status: procurementPurchaseRequests.status,
      companyId: procurementPurchaseRequests.companyId,
    })
    .from(procurementPurchaseRequests)
    .where(
      and(
        eq(procurementPurchaseRequests.id, id),
        eq(procurementPurchaseRequests.companyId, companyId),
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function updatePurchaseRequestStatusRepo(
  id: string,
  companyId: string,
  patch: Partial<typeof procurementPurchaseRequests.$inferInsert>,
) {
  const [row] = await db
    .update(procurementPurchaseRequests)
    .set(patch)
    .where(
      and(
        eq(procurementPurchaseRequests.id, id),
        eq(procurementPurchaseRequests.companyId, companyId),
      ),
    )
    .returning({ id: procurementPurchaseRequests.id });
  return row ?? null;
}

export async function listProcurementDemandsRepo(params: ListProcurementDemandsParams) {
  const where = [eq(procurementDemands.companyId, params.companyId)];
  if (params.search?.trim()) {
    const q = `%${params.search.trim()}%`;
    where.push(
      or(
        ilike(procurementDemands.demandNo, q),
        ilike(procurementDemands.itemCode, q),
        ilike(procurementDemands.itemName, q),
        ilike(procurementDemands.note, q),
      )!,
    );
  }
  if (typeof params.status === 'number') {
    where.push(eq(procurementDemands.status, params.status));
  }
  if (params.sourceModule) {
    where.push(eq(procurementDemands.sourceModule, params.sourceModule));
  }
  if (params.branchId) {
    where.push(eq(procurementDemands.branchId, params.branchId));
  }

  const [countRow] = await db
    .select({ c: count() })
    .from(procurementDemands)
    .where(and(...where));

  const rows = await db
    .select({
      id: procurementDemands.id,
      demandNo: procurementDemands.demandNo,
      sourceModule: procurementDemands.sourceModule,
      sourceEntityType: procurementDemands.sourceEntityType,
      sourceEntityId: procurementDemands.sourceEntityId,
      dedupeKey: procurementDemands.dedupeKey,
      branchId: procurementDemands.branchId,
      itemCode: procurementDemands.itemCode,
      itemName: procurementDemands.itemName,
      unit: procurementDemands.unit,
      quantity: procurementDemands.quantity,
      estimatedUnitCostPsw: procurementDemands.estimatedUnitCostPsw,
      estimatedTotalPsw: procurementDemands.estimatedTotalPsw,
      urgency: procurementDemands.urgency,
      neededBy: procurementDemands.neededBy,
      status: procurementDemands.status,
      note: procurementDemands.note,
      metadataJson: procurementDemands.metadataJson,
      requestedByUserId: procurementDemands.requestedByUserId,
      requestedByName: users.fullname,
      createdAt: procurementDemands.createdAt,
      updatedAt: procurementDemands.updatedAt,
    })
    .from(procurementDemands)
    .leftJoin(users, eq(users.id, procurementDemands.requestedByUserId))
    .where(and(...where))
    .orderBy(desc(procurementDemands.createdAt), desc(procurementDemands.id))
    .limit(params.limit)
    .offset(params.offset);

  return {
    data: rows,
    totalRecords: Number((countRow?.c as unknown as bigint) ?? 0n),
  };
}

export async function createProcurementDemandRepo(values: typeof procurementDemands.$inferInsert) {
  const [row] = await db
    .insert(procurementDemands)
    .values(values)
    .returning({ id: procurementDemands.id, demandNo: procurementDemands.demandNo });
  return row ?? null;
}

export async function findOpenProcurementDemandByDedupeKeyRepo(
  companyId: string,
  dedupeKey: string,
) {
  const [row] = await db
    .select({ id: procurementDemands.id, demandNo: procurementDemands.demandNo })
    .from(procurementDemands)
    .where(
      and(
        eq(procurementDemands.companyId, companyId),
        eq(procurementDemands.dedupeKey, dedupeKey),
        eq(procurementDemands.status, 0),
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function getProcurementDemandsByIdsRepo(companyId: string, ids: string[]) {
  if (!ids.length) return [];
  return db
    .select({
      id: procurementDemands.id,
      demandNo: procurementDemands.demandNo,
      sourceModule: procurementDemands.sourceModule,
      branchId: procurementDemands.branchId,
      itemCode: procurementDemands.itemCode,
      itemName: procurementDemands.itemName,
      unit: procurementDemands.unit,
      quantity: procurementDemands.quantity,
      estimatedUnitCostPsw: procurementDemands.estimatedUnitCostPsw,
      estimatedTotalPsw: procurementDemands.estimatedTotalPsw,
      status: procurementDemands.status,
      metadataJson: procurementDemands.metadataJson,
    })
    .from(procurementDemands)
    .where(and(eq(procurementDemands.companyId, companyId), inArray(procurementDemands.id, ids)));
}

export async function updateProcurementDemandStatusRepo(
  companyId: string,
  id: string,
  patch: Partial<typeof procurementDemands.$inferInsert>,
) {
  const [row] = await db
    .update(procurementDemands)
    .set(patch)
    .where(and(eq(procurementDemands.companyId, companyId), eq(procurementDemands.id, id)))
    .returning({ id: procurementDemands.id });
  return row ?? null;
}

export async function listProcurementFleetPoliciesRepo(params: ListProcurementFleetPoliciesParams) {
  const where = [eq(procurementFleetPolicies.companyId, params.companyId)];
  if (typeof params.isActive === 'boolean') {
    where.push(eq(procurementFleetPolicies.isActive, params.isActive));
  }
  if (params.branchId !== undefined && params.branchId !== null) {
    where.push(eq(procurementFleetPolicies.branchId, params.branchId));
  }

  return db
    .select({
      id: procurementFleetPolicies.id,
      companyId: procurementFleetPolicies.companyId,
      branchId: procurementFleetPolicies.branchId,
      preferredSupplierId: procurementFleetPolicies.preferredSupplierId,
      preferredSupplierName: procurementSuppliers.name,
      demandUrgency: procurementFleetPolicies.demandUrgency,
      replenishMultiplier: procurementFleetPolicies.replenishMultiplier,
      isActive: procurementFleetPolicies.isActive,
      note: procurementFleetPolicies.note,
      createdAt: procurementFleetPolicies.createdAt,
      updatedAt: procurementFleetPolicies.updatedAt,
    })
    .from(procurementFleetPolicies)
    .leftJoin(
      procurementSuppliers,
      eq(procurementSuppliers.id, procurementFleetPolicies.preferredSupplierId),
    )
    .where(and(...where))
    .orderBy(asc(procurementFleetPolicies.branchId), asc(procurementFleetPolicies.id));
}

export async function getProcurementFleetPolicyByIdRepo(companyId: string, id: string) {
  const [row] = await db
    .select({
      id: procurementFleetPolicies.id,
      companyId: procurementFleetPolicies.companyId,
      branchId: procurementFleetPolicies.branchId,
      preferredSupplierId: procurementFleetPolicies.preferredSupplierId,
      preferredSupplierName: procurementSuppliers.name,
      demandUrgency: procurementFleetPolicies.demandUrgency,
      replenishMultiplier: procurementFleetPolicies.replenishMultiplier,
      isActive: procurementFleetPolicies.isActive,
      note: procurementFleetPolicies.note,
      createdAt: procurementFleetPolicies.createdAt,
      updatedAt: procurementFleetPolicies.updatedAt,
    })
    .from(procurementFleetPolicies)
    .leftJoin(
      procurementSuppliers,
      eq(procurementSuppliers.id, procurementFleetPolicies.preferredSupplierId),
    )
    .where(
      and(eq(procurementFleetPolicies.companyId, companyId), eq(procurementFleetPolicies.id, id)),
    )
    .limit(1);
  return row ?? null;
}

export async function findProcurementFleetPolicyByBranchRepo(
  companyId: string,
  branchId?: string | null,
) {
  const where = [eq(procurementFleetPolicies.companyId, companyId)];
  if (branchId === null || branchId === undefined) {
    where.push(isNull(procurementFleetPolicies.branchId));
  } else {
    where.push(eq(procurementFleetPolicies.branchId, branchId));
  }
  const [row] = await db
    .select({
      id: procurementFleetPolicies.id,
      preferredSupplierId: procurementFleetPolicies.preferredSupplierId,
      demandUrgency: procurementFleetPolicies.demandUrgency,
      replenishMultiplier: procurementFleetPolicies.replenishMultiplier,
    })
    .from(procurementFleetPolicies)
    .where(and(...where))
    .limit(1);
  return row ?? null;
}

export async function createProcurementFleetPolicyRepo(
  values: typeof procurementFleetPolicies.$inferInsert,
) {
  const [row] = await db
    .insert(procurementFleetPolicies)
    .values(values)
    .returning({ id: procurementFleetPolicies.id });
  return row ?? null;
}

export async function updateProcurementFleetPolicyRepo(
  companyId: string,
  id: string,
  patch: Partial<typeof procurementFleetPolicies.$inferInsert>,
) {
  const [row] = await db
    .update(procurementFleetPolicies)
    .set(patch)
    .where(
      and(eq(procurementFleetPolicies.companyId, companyId), eq(procurementFleetPolicies.id, id)),
    )
    .returning({ id: procurementFleetPolicies.id });
  return row ?? null;
}

export type ListProcurementDemandConsolidationsParams = {
  companyId: string;
  limit: number;
  offset: number;
};

export type ListProcurementSupplierQuotesParams = {
  companyId: string;
  limit: number;
  offset: number;
  demandId?: string | null;
  supplierId?: string | null;
  status?: number | null;
};

export type ListProcurementPurchaseOrdersParams = {
  companyId: string;
  limit: number;
  offset: number;
  supplierId?: string | null;
  status?: number | null;
};

export type ListProcurementGoodsReceiptsParams = {
  companyId: string;
  limit: number;
  offset: number;
  purchaseOrderId?: string | null;
};

export async function createProcurementDemandConsolidationRepo(
  values: typeof procurementDemandConsolidations.$inferInsert,
) {
  const [row] = await db.insert(procurementDemandConsolidations).values(values).returning({
    id: procurementDemandConsolidations.id,
    consolidationNo: procurementDemandConsolidations.consolidationNo,
  });
  return row ?? null;
}

export async function createProcurementDemandConsolidationItemsRepo(
  values: (typeof procurementDemandConsolidationItems.$inferInsert)[],
) {
  if (!values.length) return [];
  return db.insert(procurementDemandConsolidationItems).values(values).returning({
    id: procurementDemandConsolidationItems.id,
  });
}

export async function listProcurementDemandConsolidationsRepo(
  params: ListProcurementDemandConsolidationsParams,
) {
  const [countRow] = await db
    .select({ c: count() })
    .from(procurementDemandConsolidations)
    .where(eq(procurementDemandConsolidations.companyId, params.companyId));

  const rows = await db
    .select()
    .from(procurementDemandConsolidations)
    .where(eq(procurementDemandConsolidations.companyId, params.companyId))
    .orderBy(
      desc(procurementDemandConsolidations.createdAt),
      desc(procurementDemandConsolidations.id),
    )
    .limit(params.limit)
    .offset(params.offset);

  return {
    data: rows,
    totalRecords: Number((countRow?.c as unknown as bigint) ?? 0n),
  };
}

export async function createProcurementSupplierQuoteRepo(
  values: typeof procurementSupplierQuotes.$inferInsert,
) {
  const [row] = await db
    .insert(procurementSupplierQuotes)
    .values(values)
    .returning({ id: procurementSupplierQuotes.id, quoteNo: procurementSupplierQuotes.quoteNo });
  return row ?? null;
}

export async function listProcurementSupplierQuotesRepo(
  params: ListProcurementSupplierQuotesParams,
) {
  const where = [eq(procurementSupplierQuotes.companyId, params.companyId)];
  if (params.demandId) where.push(eq(procurementSupplierQuotes.demandId, params.demandId));
  if (params.supplierId) where.push(eq(procurementSupplierQuotes.supplierId, params.supplierId));
  if (typeof params.status === 'number')
    where.push(eq(procurementSupplierQuotes.status, params.status));

  const [countRow] = await db
    .select({ c: count() })
    .from(procurementSupplierQuotes)
    .where(and(...where));

  const rows = await db
    .select()
    .from(procurementSupplierQuotes)
    .where(and(...where))
    .orderBy(desc(procurementSupplierQuotes.createdAt), desc(procurementSupplierQuotes.id))
    .limit(params.limit)
    .offset(params.offset);

  return {
    data: rows,
    totalRecords: Number((countRow?.c as unknown as bigint) ?? 0n),
  };
}

export async function updateProcurementSupplierQuoteRepo(
  companyId: string,
  id: string,
  patch: Partial<typeof procurementSupplierQuotes.$inferInsert>,
) {
  const [row] = await db
    .update(procurementSupplierQuotes)
    .set({ ...patch, updatedAt: new Date() })
    .where(
      and(eq(procurementSupplierQuotes.companyId, companyId), eq(procurementSupplierQuotes.id, id)),
    )
    .returning({ id: procurementSupplierQuotes.id });
  return row ?? null;
}

export async function getProcurementSupplierQuoteByIdRepo(companyId: string, id: string) {
  const [row] = await db
    .select()
    .from(procurementSupplierQuotes)
    .where(
      and(eq(procurementSupplierQuotes.companyId, companyId), eq(procurementSupplierQuotes.id, id)),
    )
    .limit(1);
  return row ?? null;
}

export async function createProcurementPurchaseOrderRepo(
  values: typeof procurementPurchaseOrders.$inferInsert,
) {
  const [row] = await db
    .insert(procurementPurchaseOrders)
    .values(values)
    .returning({ id: procurementPurchaseOrders.id, poNo: procurementPurchaseOrders.poNo });
  return row ?? null;
}

export async function createProcurementPurchaseOrderItemsRepo(
  values: (typeof procurementPurchaseOrderItems.$inferInsert)[],
) {
  if (!values.length) return [];
  return db.insert(procurementPurchaseOrderItems).values(values).returning({
    id: procurementPurchaseOrderItems.id,
  });
}

export async function listProcurementPurchaseOrdersRepo(
  params: ListProcurementPurchaseOrdersParams,
) {
  const where = [eq(procurementPurchaseOrders.companyId, params.companyId)];
  if (params.supplierId) where.push(eq(procurementPurchaseOrders.supplierId, params.supplierId));
  if (typeof params.status === 'number')
    where.push(eq(procurementPurchaseOrders.status, params.status));

  const [countRow] = await db
    .select({ c: count() })
    .from(procurementPurchaseOrders)
    .where(and(...where));

  const rows = await db
    .select()
    .from(procurementPurchaseOrders)
    .where(and(...where))
    .orderBy(desc(procurementPurchaseOrders.createdAt), desc(procurementPurchaseOrders.id))
    .limit(params.limit)
    .offset(params.offset);

  return {
    data: rows,
    totalRecords: Number((countRow?.c as unknown as bigint) ?? 0n),
  };
}

export async function getProcurementPurchaseOrderByIdRepo(companyId: string, id: string) {
  const [row] = await db
    .select()
    .from(procurementPurchaseOrders)
    .where(
      and(eq(procurementPurchaseOrders.companyId, companyId), eq(procurementPurchaseOrders.id, id)),
    )
    .limit(1);
  return row ?? null;
}

export async function listProcurementPurchaseOrderItemsRepo(purchaseOrderId: string) {
  return db
    .select()
    .from(procurementPurchaseOrderItems)
    .where(eq(procurementPurchaseOrderItems.purchaseOrderId, purchaseOrderId))
    .orderBy(asc(procurementPurchaseOrderItems.createdAt), asc(procurementPurchaseOrderItems.id));
}

export async function updateProcurementPurchaseOrderItemRepo(
  id: string,
  patch: Partial<typeof procurementPurchaseOrderItems.$inferInsert>,
) {
  const [row] = await db
    .update(procurementPurchaseOrderItems)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(procurementPurchaseOrderItems.id, id))
    .returning({ id: procurementPurchaseOrderItems.id });
  return row ?? null;
}

export async function updateProcurementPurchaseOrderRepo(
  companyId: string,
  id: string,
  patch: Partial<typeof procurementPurchaseOrders.$inferInsert>,
) {
  const [row] = await db
    .update(procurementPurchaseOrders)
    .set({ ...patch, updatedAt: new Date() })
    .where(
      and(eq(procurementPurchaseOrders.companyId, companyId), eq(procurementPurchaseOrders.id, id)),
    )
    .returning({ id: procurementPurchaseOrders.id });
  return row ?? null;
}

export async function createProcurementGoodsReceiptRepo(
  values: typeof procurementGoodsReceipts.$inferInsert,
) {
  const [row] = await db
    .insert(procurementGoodsReceipts)
    .values(values)
    .returning({ id: procurementGoodsReceipts.id, receiptNo: procurementGoodsReceipts.receiptNo });
  return row ?? null;
}

export async function createProcurementGoodsReceiptItemsRepo(
  values: (typeof procurementGoodsReceiptItems.$inferInsert)[],
) {
  if (!values.length) return [];
  return db.insert(procurementGoodsReceiptItems).values(values).returning({
    id: procurementGoodsReceiptItems.id,
  });
}

export async function listProcurementGoodsReceiptsRepo(params: ListProcurementGoodsReceiptsParams) {
  const where = [eq(procurementGoodsReceipts.companyId, params.companyId)];
  if (params.purchaseOrderId)
    where.push(eq(procurementGoodsReceipts.purchaseOrderId, params.purchaseOrderId));

  const [countRow] = await db
    .select({ c: count() })
    .from(procurementGoodsReceipts)
    .where(and(...where));

  const rows = await db
    .select()
    .from(procurementGoodsReceipts)
    .where(and(...where))
    .orderBy(desc(procurementGoodsReceipts.createdAt), desc(procurementGoodsReceipts.id))
    .limit(params.limit)
    .offset(params.offset);

  return {
    data: rows,
    totalRecords: Number((countRow?.c as unknown as bigint) ?? 0n),
  };
}
