import { and, asc, eq, gt, or } from 'drizzle-orm';
import { db } from '@/db/config';
import { cashierSessionTypes, cashierSessions } from '@/db/schemas';

export type SessionTypeRow = {
  id: string;
  sessionType: string;
  startTime: string;
  endTime: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
};

export async function listSessionTypesRepo(): Promise<SessionTypeRow[]> {
  const rows = await db
    .select({
      id: cashierSessionTypes.id,
      sessionType: cashierSessionTypes.sessionType,
      startTime: cashierSessionTypes.startTime,
      endTime: cashierSessionTypes.endTime,
      createdBy: cashierSessionTypes.createdBy,
      createdAt: cashierSessionTypes.createdAt,
      updatedAt: cashierSessionTypes.updatedAt,
    })
    .from(cashierSessionTypes)
    .orderBy(asc(cashierSessionTypes.sessionType));
  return rows;
}

export async function createSessionTypeRepo(
  values: typeof cashierSessionTypes.$inferInsert,
): Promise<{ id: string }> {
  const [row] = await db
    .insert(cashierSessionTypes)
    .values(values)
    .returning({ id: cashierSessionTypes.id });
  return row;
}

export type SessionRow = {
  id: string;
  cashierId: string;
  branchId: string;
  sessionTypeId: string;
  startTime: Date;
  endTime: Date | null;
  openingBalancePsw: bigint;
  closingBalancePsw: bigint | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

export type ListSessionsParams = {
  limit: number;
  after?: { startTime: string; id: string } | null;
  cashierId?: string | null;
  branchId?: string | null;
  activeOnly?: boolean | null;
};

export async function listSessionsRepo(
  p: ListSessionsParams,
): Promise<{ data: SessionRow[]; nextCursor: { startTime: string; id: string } | null }> {
  const where: (ReturnType<typeof eq> | ReturnType<typeof and> | ReturnType<typeof or>)[] = [];
  if (p.cashierId) where.push(eq(cashierSessions.cashierId, p.cashierId));
  if (p.branchId) where.push(eq(cashierSessions.branchId, p.branchId));
  if (p.activeOnly) where.push(eq(cashierSessions.status, 'ACTIVE'));
  if (p.after) {
    where.push(
      or(
        gt(cashierSessions.startTime, new Date(p.after.startTime)),
        and(
          eq(cashierSessions.startTime, new Date(p.after.startTime)),
          gt(cashierSessions.id, p.after.id),
        ),
      ),
    );
  }

  const rows = await db
    .select({
      id: cashierSessions.id,
      cashierId: cashierSessions.cashierId,
      branchId: cashierSessions.branchId,
      sessionTypeId: cashierSessions.sessionTypeId,
      startTime: cashierSessions.startTime,
      endTime: cashierSessions.endTime,
      openingBalancePsw: cashierSessions.openingBalancePsw,
      closingBalancePsw: cashierSessions.closingBalancePsw,
      status: cashierSessions.status,
      createdAt: cashierSessions.createdAt,
      updatedAt: cashierSessions.updatedAt,
    })
    .from(cashierSessions)
    .where(where.length ? and(...where) : undefined)
    .orderBy(asc(cashierSessions.startTime), asc(cashierSessions.id))
    .limit(p.limit + 1);

  const hasMore = rows.length > p.limit;
  const data = hasMore ? rows.slice(0, p.limit) : rows;
  const nextCursor = hasMore
    ? { startTime: data[data.length - 1]!.startTime.toISOString(), id: data[data.length - 1]!.id }
    : null;

  return { data, nextCursor };
}

export async function openSessionRepo(
  values: typeof cashierSessions.$inferInsert,
): Promise<{ id: string }> {
  const [row] = await db
    .insert(cashierSessions)
    .values(values)
    .returning({ id: cashierSessions.id });
  return row;
}

export async function closeSessionRepo(
  id: string,
  patch: Pick<typeof cashierSessions.$inferInsert, 'endTime' | 'closingBalancePsw' | 'status'>,
): Promise<{ id: string } | null> {
  const [row] = await db
    .update(cashierSessions)
    .set(patch)
    .where(eq(cashierSessions.id, id))
    .returning({ id: cashierSessions.id });
  return row ?? null;
}

export async function getSessionRepo(id: string): Promise<SessionRow | null> {
  const [row] = await db
    .select({
      id: cashierSessions.id,
      cashierId: cashierSessions.cashierId,
      branchId: cashierSessions.branchId,
      sessionTypeId: cashierSessions.sessionTypeId,
      startTime: cashierSessions.startTime,
      endTime: cashierSessions.endTime,
      openingBalancePsw: cashierSessions.openingBalancePsw,
      closingBalancePsw: cashierSessions.closingBalancePsw,
      status: cashierSessions.status,
      createdAt: cashierSessions.createdAt,
      updatedAt: cashierSessions.updatedAt,
    })
    .from(cashierSessions)
    .where(eq(cashierSessions.id, id))
    .limit(1);
  return row ?? null;
}
