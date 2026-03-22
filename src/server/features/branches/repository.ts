import { and, asc, count, desc, eq, sql } from 'drizzle-orm';
import { db } from '@/db/config';
import { branches } from '@/db/schemas';
import type { SortField } from '@/server/types/pagination.types';

export type ListBranchParams = {
  limit: number;
  offset: number;
  companyId?: string | null;
  sort?: SortField[] | null;
};

export type BranchOptionRow = {
  id: string;
  name: string;
  type: number;
};

export async function listBranchesRepo(p: ListBranchParams) {
  const where = [];
  if (p.companyId) where.push(eq(branches.companyId, p.companyId));

  const sort = p.sort ?? [];
  const orderBy = sort.length
    ? sort
        .map((s) => {
          if (s.field === 'createdAt')
            return s.direction === 'desc' ? desc(branches.createdAt) : asc(branches.createdAt);
          if (s.field === 'name')
            return s.direction === 'desc' ? desc(branches.name) : asc(branches.name);
          if (s.field === 'id')
            return s.direction === 'desc' ? desc(branches.id) : asc(branches.id);
          return null;
        })
        .filter((value): value is ReturnType<typeof asc> => value !== null)
    : [asc(branches.createdAt), asc(branches.id)];

  const [countRow] = await db
    .select({ c: count() })
    .from(branches)
    .where(where.length ? and(...where) : undefined);

  const totalRecords = Number((countRow?.c as unknown as bigint) ?? 0n);
  const rows = await db
    .select({
      id: branches.id,
      companyId: branches.companyId,
      name: branches.name,
      type: branches.type,
      telephone: branches.telephone,
      address: branches.address,
      email: branches.email,
      usePickupQueue: branches.usePickupQueue,
      isDeleted: branches.isDeleted,
      createdBy: branches.createdBy,
      createdAt: branches.createdAt,
      updatedAt: branches.updatedAt,
    })
    .from(branches)
    .where(where.length ? and(...where) : undefined)
    .orderBy(...orderBy)
    .limit(p.limit)
    .offset(p.offset);

  return { data: rows, totalRecords };
}

export async function listBranchOptionsRepo(p: {
  companyId?: string | null;
  search?: string | null;
  includeDeleted?: boolean | null;
}): Promise<BranchOptionRow[]> {
  const where = [];
  if (p.companyId) where.push(eq(branches.companyId, p.companyId));
  if (!p.includeDeleted) where.push(eq(branches.isDeleted, false));
  if (p.search) where.push(sql`${branches.name} ILIKE ${`%${p.search}%`}`);

  return db
    .select({
      id: branches.id,
      name: branches.name,
      type: branches.type,
    })
    .from(branches)
    .where(where.length ? and(...where) : undefined)
    .orderBy(asc(branches.name), asc(branches.id));
}

export async function getBranchRepo(id: string) {
  const [row] = await db
    .select({
      id: branches.id,
      companyId: branches.companyId,
      name: branches.name,
      type: branches.type,
      telephone: branches.telephone,
      address: branches.address,
      email: branches.email,
      usePickupQueue: branches.usePickupQueue,
      isDeleted: branches.isDeleted,
      createdBy: branches.createdBy,
      createdAt: branches.createdAt,
      updatedAt: branches.updatedAt,
    })
    .from(branches)
    .where(eq(branches.id, id))
    .limit(1);
  return row ?? null;
}

// Case-insensitive uniqueness guard: companyId + lower(name)
export async function findBranchByNameRepo(companyId: string, name: string) {
  const [row] = await db
    .select({ id: branches.id, isDeleted: branches.isDeleted })
    .from(branches)
    .where(and(eq(branches.companyId, companyId), sql`lower(${branches.name}) = lower(${name})`))
    .limit(1);
  return row ?? null;
}

export async function createBranchRepo(values: typeof branches.$inferInsert) {
  const [row] = await db.insert(branches).values(values).returning({ id: branches.id });
  return row;
}

export async function updateBranchRepo(id: string, patch: Partial<typeof branches.$inferInsert>) {
  const [row] = await db
    .update(branches)
    .set(patch)
    .where(eq(branches.id, id))
    .returning({ id: branches.id });
  return row ?? null;
}

export async function softDeleteBranchRepo(id: string) {
  const rows = await db
    .update(branches)
    .set({ isDeleted: true })
    .where(eq(branches.id, id))
    .returning({ id: branches.id });
  return rows.length;
}
