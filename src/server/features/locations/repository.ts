import { and, asc, eq, gt, or, sql } from 'drizzle-orm';
import { db } from '@/db/config';
import { locations } from '@/db/schemas';

export type ListLocationParams = {
  limit: number;
  after?: { createdAt: string; id: string } | null;
  companyId?: string | null;
  branchId?: string | null;
  includeDeleted?: boolean | null;
};

export async function listLocationsRepo(p: ListLocationParams) {
  const where = [];
  if (p.companyId) where.push(eq(locations.companyId, p.companyId));
  if (p.branchId) where.push(eq(locations.branchId, p.branchId));
  if (!p.includeDeleted) where.push(eq(locations.isDeleted, false));
  if (p.after) {
    where.push(
      or(
        gt(locations.createdAt, new Date(p.after.createdAt)),
        and(eq(locations.createdAt, new Date(p.after.createdAt)), gt(locations.id, p.after.id)),
      ),
    );
  }
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
    .orderBy(asc(locations.createdAt), asc(locations.id))
    .limit(p.limit + 1);

  const hasMore = rows.length > p.limit;
  const data = hasMore ? rows.slice(0, p.limit) : rows;
  const nextCursor = hasMore
    ? { createdAt: data[data.length - 1]!.createdAt!.toISOString(), id: data[data.length - 1]!.id }
    : null;

  return { data, nextCursor };
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
