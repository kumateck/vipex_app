import { and, asc, count, desc, eq, sql } from 'drizzle-orm';
import { db } from '@/db/config';
import { locations } from '@/db/schemas';
import type { SortField } from '@/server/types/pagination.types';

export type ListLocationParams = {
  limit: number;
  offset: number;
  companyId?: string | null;
  branchId?: string | null;
  includeDeleted?: boolean | null;
  sort?: SortField[] | null;
};

export async function listLocationsRepo(p: ListLocationParams) {
  const where = [];
  if (p.companyId) where.push(eq(locations.companyId, p.companyId));
  if (p.branchId) where.push(eq(locations.branchId, p.branchId));
  if (!p.includeDeleted) where.push(eq(locations.isDeleted, false));
  const sort = p.sort ?? [];
  const orderBy = sort.length
    ? sort
        .map((s) => {
          if (s.field === 'createdAt')
            return s.direction === 'desc' ? desc(locations.createdAt) : asc(locations.createdAt);
          if (s.field === 'name')
            return s.direction === 'desc' ? desc(locations.name) : asc(locations.name);
          if (s.field === 'id')
            return s.direction === 'desc' ? desc(locations.id) : asc(locations.id);
          return null;
        })
        .filter((value): value is ReturnType<typeof asc> => value !== null)
    : [asc(locations.createdAt), asc(locations.id)];

  const [countRow] = await db
    .select({ c: count() })
    .from(locations)
    .where(where.length ? and(...where) : undefined);
  const totalRecords = Number((countRow?.c as unknown as bigint) ?? 0n);
  const rows = await db
    .select({
      id: locations.id,
      companyId: locations.companyId,
      branchId: locations.branchId,
      name: locations.name,
      isDeleted: locations.isDeleted,
      createdBy: locations.createdBy,
      createdAt: locations.createdAt,
      updatedAt: locations.updatedAt,
    })
    .from(locations)
    .where(where.length ? and(...where) : undefined)
    .orderBy(...orderBy)
    .limit(p.limit)
    .offset(p.offset);

  return { data: rows, totalRecords };
}

export async function getLocationRepo(id: string) {
  const [row] = await db
    .select({
      id: locations.id,
      companyId: locations.companyId,
      branchId: locations.branchId,
      name: locations.name,
      isDeleted: locations.isDeleted,
      createdBy: locations.createdBy,
      createdAt: locations.createdAt,
      updatedAt: locations.updatedAt,
    })
    .from(locations)
    .where(eq(locations.id, id))
    .limit(1);
  return row ?? null;
}

export async function findLocationByNameRepo(branchId: string, name: string) {
  const [row] = await db
    .select({ id: locations.id, isDeleted: locations.isDeleted })
    .from(locations)
    .where(and(eq(locations.branchId, branchId), sql`lower(${locations.name}) = lower(${name})`))
    .limit(1);
  return row ?? null;
}

export async function createLocationRepo(values: typeof locations.$inferInsert) {
  const [row] = await db.insert(locations).values(values).returning({ id: locations.id });
  return row;
}

export async function updateLocationRepo(
  id: string,
  patch: Partial<typeof locations.$inferInsert>,
) {
  const [row] = await db
    .update(locations)
    .set(patch)
    .where(eq(locations.id, id))
    .returning({ id: locations.id });
  return row ?? null;
}

export async function softDeleteLocationRepo(id: string) {
  const rows = await db
    .update(locations)
    .set({ isDeleted: true })
    .where(eq(locations.id, id))
    .returning({ id: locations.id });
  return rows.length;
}
