import { and, asc, eq, gt, inArray, or, sql } from 'drizzle-orm';
import { db } from '@/db/config';
import { branches, locations } from '@/db/schemas';

export type ListBranchParams = {
  limit: number;
  after?: { createdAt: string; id: string } | null;
  companyId?: string | null;
};

export async function listBranchesRepo(p: ListBranchParams) {
  const where = [];
  if (p.companyId) where.push(eq(branches.companyId, p.companyId));
  if (p.after) {
    where.push(
      or(
        gt(branches.createdAt, new Date(p.after.createdAt)),
        and(eq(branches.createdAt, new Date(p.after.createdAt)), gt(branches.id, p.after.id)),
      ),
    );
  }
  const rows = await db
    .select({
      id: branches.id,
      companyId: branches.companyId,
      name: branches.name,
      type: branches.type,
      telephone: branches.telephone,
      address: branches.address,
      email: branches.email,
      isDeleted: branches.isDeleted,
      createdBy: branches.createdBy,
      createdAt: branches.createdAt,
      updatedAt: branches.updatedAt,
    })
    .from(branches)
    .where(where.length ? and(...where) : undefined)
    .orderBy(asc(branches.createdAt), asc(branches.id))
    .limit(p.limit + 1);

  const hasMore = rows.length > p.limit;
  const data = hasMore ? rows.slice(0, p.limit) : rows;
  const nextCursor = hasMore
    ? { createdAt: data[data.length - 1]!.createdAt!.toISOString(), id: data[data.length - 1]!.id }
    : null;

  // Fetch associated locations for all branches in this page (non-deleted only).
  const branchIds = data.map((b) => b.id);
  const locationRows =
    branchIds.length > 0
      ? await db
          .select({
            id: locations.id,
            name: locations.name,
            branchId: locations.branchId,
          })
          .from(locations)
          .where(
            and(inArray(locations.branchId, branchIds), eq(locations.isDeleted, false)),
          )
          .orderBy(asc(locations.name))
      : [];

  // Group locations by branchId so we can attach them to each branch.
  const locationsByBranchId = locationRows.reduce(
    (acc, loc) => {
      const bid = loc.branchId;
      if (!acc[bid]) acc[bid] = [];
      acc[bid].push({ id: loc.id, name: loc.name });
      return acc;
    },
    {} as Record<string, { id: string; name: string }[]>,
  );

  // Return branch rows with a `locations` array each (empty if none).
  const dataWithLocations = data.map((b) => ({
    ...b,
    locations: locationsByBranchId[b.id] ?? [],
  }));

  return { data: dataWithLocations, nextCursor };
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
    .select({ id: branches.id })
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
