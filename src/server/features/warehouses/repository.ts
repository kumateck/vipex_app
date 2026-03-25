import { and, asc, count, desc, eq, sql } from 'drizzle-orm';
import { db } from '@/db/config';
import { branches, warehouses } from '@/db/schemas';
import type { SortField } from '@/server/types/pagination.types';

export type ListWarehouseParams = {
  limit: number;
  offset: number;
  companyId?: string | null;
  branchId?: string | null;
  includeDeleted?: boolean | null;
  sort?: SortField[] | null;
};

export type WarehouseOptionRow = {
  id: string;
  name: string;
  branchId: string;
};

export async function listWarehousesRepo(p: ListWarehouseParams) {
  const where = [];
  if (p.companyId) where.push(eq(warehouses.companyId, p.companyId));
  if (p.branchId) where.push(eq(warehouses.branchId, p.branchId));
  if (!p.includeDeleted) where.push(eq(warehouses.isDeleted, false));

  const sort = p.sort ?? [];
  const orderBy = sort.length
    ? sort
        .map((s) => {
          if (s.field === 'createdAt')
            return s.direction === 'desc' ? desc(warehouses.createdAt) : asc(warehouses.createdAt);
          if (s.field === 'name')
            return s.direction === 'desc' ? desc(warehouses.name) : asc(warehouses.name);
          if (s.field === 'id')
            return s.direction === 'desc' ? desc(warehouses.id) : asc(warehouses.id);
          return null;
        })
        .filter((value): value is ReturnType<typeof asc> => value !== null)
    : [asc(warehouses.createdAt), asc(warehouses.id)];

  const [countRow] = await db
    .select({ c: count() })
    .from(warehouses)
    .where(where.length ? and(...where) : undefined);
  const totalRecords = Number((countRow?.c as unknown as bigint) ?? 0n);

  const rows = await db
    .select({
      id: warehouses.id,
      companyId: warehouses.companyId,
      branchId: warehouses.branchId,
      branch: {
        id: branches.id,
        name: branches.name,
      },
      name: warehouses.name,
      description: warehouses.description,
      active: warehouses.active,
      isDeleted: warehouses.isDeleted,
      createdBy: warehouses.createdBy,
      createdAt: warehouses.createdAt,
      updatedAt: warehouses.updatedAt,
    })
    .from(warehouses)
    .leftJoin(branches, eq(warehouses.branchId, branches.id))
    .where(where.length ? and(...where) : undefined)
    .orderBy(...orderBy)
    .limit(p.limit)
    .offset(p.offset);

  return { data: rows, totalRecords };
}

export async function getWarehouseRepo(id: string) {
  const [row] = await db
    .select({
      id: warehouses.id,
      companyId: warehouses.companyId,
      branchId: warehouses.branchId,
      branch: {
        id: branches.id,
        name: branches.name,
      },
      name: warehouses.name,
      description: warehouses.description,
      active: warehouses.active,
      isDeleted: warehouses.isDeleted,
      createdBy: warehouses.createdBy,
      createdAt: warehouses.createdAt,
      updatedAt: warehouses.updatedAt,
    })
    .from(warehouses)
    .leftJoin(branches, eq(warehouses.branchId, branches.id))
    .where(eq(warehouses.id, id))
    .limit(1);

  return row ?? null;
}

export async function listWarehouseOptionsRepo(p: {
  companyId?: string | null;
  branchId?: string | null;
  search?: string | null;
  includeDeleted?: boolean | null;
  activeOnly?: boolean | null;
}): Promise<WarehouseOptionRow[]> {
  const where = [];
  if (p.companyId) where.push(eq(warehouses.companyId, p.companyId));
  if (p.branchId) where.push(eq(warehouses.branchId, p.branchId));
  if (!p.includeDeleted) where.push(eq(warehouses.isDeleted, false));
  if (p.activeOnly) where.push(eq(warehouses.active, true));
  if (p.search) where.push(sql`${warehouses.name} ILIKE ${`%${p.search}%`}`);

  return db
    .select({
      id: warehouses.id,
      name: warehouses.name,
      branchId: warehouses.branchId,
    })
    .from(warehouses)
    .where(where.length ? and(...where) : undefined)
    .orderBy(asc(warehouses.name), asc(warehouses.id));
}

export async function findWarehouseByNameRepo(branchId: string, name: string) {
  const [row] = await db
    .select({ id: warehouses.id, isDeleted: warehouses.isDeleted })
    .from(warehouses)
    .where(and(eq(warehouses.branchId, branchId), sql`lower(${warehouses.name}) = lower(${name})`))
    .limit(1);

  return row ?? null;
}

export async function createWarehouseRepo(values: typeof warehouses.$inferInsert) {
  const [row] = await db.insert(warehouses).values(values).returning({ id: warehouses.id });
  return row ?? null;
}

export async function updateWarehouseRepo(
  id: string,
  patch: Partial<typeof warehouses.$inferInsert>,
) {
  const [row] = await db
    .update(warehouses)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(warehouses.id, id))
    .returning({ id: warehouses.id });
  return row ?? null;
}

export async function softDeleteWarehouseRepo(id: string) {
  const rows = await db
    .update(warehouses)
    .set({ isDeleted: true, updatedAt: new Date() })
    .where(eq(warehouses.id, id))
    .returning({ id: warehouses.id });
  return rows.length;
}

export async function getWarehouseUsageSummaryRepo(id: string) {
  const [row] = await db
    .select({
      holderCount: sql<number>`count(*)`,
    })
    .from(warehouses)
    .leftJoin(
      sql`parcel_internal_holders`,
      sql`parcel_internal_holders.warehouse_id = ${warehouses.id}`,
    )
    .where(and(eq(warehouses.id, id), eq(warehouses.isDeleted, false)))
    .groupBy(warehouses.id);

  return { holderCount: Number(row?.holderCount ?? 0) };
}
