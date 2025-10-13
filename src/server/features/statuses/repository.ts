import { and, asc, eq, gt, or, sql } from 'drizzle-orm';
import { db } from '@/db/config';
import { statuses } from '@/db/schemas';

export type ListStatusParams = {
  limit: number;
  after?: { createdAt: string; id: string } | null;
  companyId?: string | null;
  includeDeleted?: boolean | null;
};

export async function listStatusesRepo(p: ListStatusParams) {
  const where = [];
  if (p.companyId) where.push(eq(statuses.companyId, p.companyId));
  if (!p.includeDeleted) where.push(eq(statuses.isDeleted, false));
  if (p.after) {
    where.push(
      or(
        gt(statuses.createdAt, new Date(p.after.createdAt)),
        and(eq(statuses.createdAt, new Date(p.after.createdAt)), gt(statuses.id, p.after.id)),
      ),
    );
  }
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
    .orderBy(asc(statuses.createdAt), asc(statuses.id))
    .limit(p.limit + 1);

  const hasMore = rows.length > p.limit;
  const data = hasMore ? rows.slice(0, p.limit) : rows;
  const nextCursor = hasMore
    ? { createdAt: data[data.length - 1]!.createdAt!.toISOString(), id: data[data.length - 1]!.id }
    : null;

  return { data, nextCursor };
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
