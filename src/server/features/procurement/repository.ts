import { and, asc, count, desc, eq, ilike, or } from 'drizzle-orm';
import { db } from '@/db/config';
import { procurementPurchaseRequests, procurementSuppliers, users } from '@/db/schemas';

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
