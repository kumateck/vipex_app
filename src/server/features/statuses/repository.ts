import { and, asc, count, desc, eq, sql } from 'drizzle-orm';
import { db } from '@/db/config';
import { statuses } from '@/db/schemas';
import type { SortField } from '@/server/types/pagination.types';

export type ListStatusParams = {
  limit: number;
  offset: number;
  companyId?: string | null;
  includeDeleted?: boolean | null;
  sort?: SortField[] | null;
};

export type StatusOptionRow = {
  id: string;
  name: string;
  color: string;
};

export async function listStatusesRepo(p: ListStatusParams) {
  const where = [];
  if (p.companyId) where.push(eq(statuses.companyId, p.companyId));
  if (!p.includeDeleted) where.push(eq(statuses.isDeleted, false));
  const sort = p.sort ?? [];
  const orderBy = sort.length
    ? sort
        .map((s) => {
          if (s.field === 'createdAt')
            return s.direction === 'desc' ? desc(statuses.createdAt) : asc(statuses.createdAt);
          if (s.field === 'name')
            return s.direction === 'desc' ? desc(statuses.name) : asc(statuses.name);
          if (s.field === 'id')
            return s.direction === 'desc' ? desc(statuses.id) : asc(statuses.id);
          return null;
        })
        .filter((value): value is ReturnType<typeof asc> => value !== null)
    : [asc(statuses.createdAt), asc(statuses.id)];

  const [countRow] = await db
    .select({ c: count() })
    .from(statuses)
    .where(where.length ? and(...where) : undefined);
  const totalRecords = Number((countRow?.c as unknown as bigint) ?? 0n);
  const rows = await db
    .select({
      id: statuses.id,
      companyId: statuses.companyId,
      name: statuses.name,
      color: statuses.color,
      isDeleted: statuses.isDeleted,
      createdBy: statuses.createdBy,
      createdAt: statuses.createdAt,
      updatedAt: statuses.updatedAt,
    })
    .from(statuses)
    .where(where.length ? and(...where) : undefined)
    .orderBy(...orderBy)
    .limit(p.limit)
    .offset(p.offset);

  return { data: rows, totalRecords };
}

export async function listStatusOptionsRepo(p: {
  companyId?: string | null;
  search?: string | null;
  includeDeleted?: boolean | null;
}): Promise<StatusOptionRow[]> {
  const where = [];
  if (p.companyId) where.push(eq(statuses.companyId, p.companyId));
  if (!p.includeDeleted) where.push(eq(statuses.isDeleted, false));
  if (p.search) where.push(sql`${statuses.name} ILIKE ${`%${p.search}%`}`);

  return db
    .select({
      id: statuses.id,
      name: statuses.name,
      color: statuses.color,
    })
    .from(statuses)
    .where(where.length ? and(...where) : undefined)
    .orderBy(asc(statuses.name), asc(statuses.id));
}

export async function getStatusRepo(id: string) {
  const [row] = await db
    .select({
      id: statuses.id,
      companyId: statuses.companyId,
      name: statuses.name,
      color: statuses.color,
      isDeleted: statuses.isDeleted,
      createdBy: statuses.createdBy,
      createdAt: statuses.createdAt,
      updatedAt: statuses.updatedAt,
    })
    .from(statuses)
    .where(eq(statuses.id, id))
    .limit(1);
  return row ?? null;
}

export async function findStatusByNameRepo(companyId: string, name: string) {
  const [row] = await db
    .select({ id: statuses.id, isDeleted: statuses.isDeleted })
    .from(statuses)
    .where(and(eq(statuses.companyId, companyId), sql`lower(${statuses.name}) = lower(${name})`))
    .limit(1);
  return row ?? null;
}

export async function createStatusRepo(values: typeof statuses.$inferInsert) {
  const [row] = await db.insert(statuses).values(values).returning({ id: statuses.id });
  return row;
}

export async function updateStatusRepo(id: string, patch: Partial<typeof statuses.$inferInsert>) {
  const [row] = await db
    .update(statuses)
    .set(patch)
    .where(eq(statuses.id, id))
    .returning({ id: statuses.id });
  return row ?? null;
}

export async function softDeleteStatusRepo(id: string) {
  const rows = await db
    .update(statuses)
    .set({ isDeleted: true })
    .where(eq(statuses.id, id))
    .returning({ id: statuses.id });
  return rows.length;
}
