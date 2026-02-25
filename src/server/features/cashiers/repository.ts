import { and, asc, count, desc, eq, or } from 'drizzle-orm';
import { db } from '@/db/config';
import { cashierSessionTypes, cashierSessions } from '@/db/schemas';
import type { SortField } from '@/server/types/pagination.types';

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
  return row!;
}

export type SessionRow = {
  id: string;
  cashierId: string;
  branchId: string;
  shiftTypeId: string | null;
  scheduledStartTime: Date;
  actualEndTime: Date | null;
  openingBalancePsw: number;
  closingBalancePsw: number | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

export type ListSessionsParams = {
  limit: number;
  offset: number;
  cashierId?: string | null;
  branchId?: string | null;
  activeOnly?: boolean | null;
  sort?: SortField[] | null;
};

export async function listSessionsRepo(
  p: ListSessionsParams,
): Promise<{ data: SessionRow[]; totalRecords: number }> {
  const where: (ReturnType<typeof eq> | ReturnType<typeof and> | ReturnType<typeof or>)[] = [];
  if (p.cashierId) where.push(eq(cashierSessions.cashierId, p.cashierId));
  if (p.branchId) where.push(eq(cashierSessions.branchId, p.branchId));
  if (p.activeOnly) where.push(eq(cashierSessions.status, 'ACTIVE'));
  const sort = p.sort ?? [];
  const orderBy = sort.length
    ? sort
        .map((s) => {
          if (s.field === 'scheduledStartTime')
            return s.direction === 'desc'
              ? desc(cashierSessions.scheduledStartTime)
              : asc(cashierSessions.scheduledStartTime);
          if (s.field === 'createdAt')
            return s.direction === 'desc' ? desc(cashierSessions.createdAt) : asc(cashierSessions.createdAt);
          if (s.field === 'id')
            return s.direction === 'desc' ? desc(cashierSessions.id) : asc(cashierSessions.id);
          return null;
        })
        .filter((value): value is ReturnType<typeof asc> => value !== null)
    : [asc(cashierSessions.scheduledStartTime), asc(cashierSessions.id)];

  const [countRow] = await db
    .select({ c: count() })
    .from(cashierSessions)
    .where(where.length ? and(...where) : undefined);
  const totalRecords = Number((countRow?.c as unknown as bigint) ?? 0n);

  const rows = await db
    .select({
      id: cashierSessions.id,
      cashierId: cashierSessions.cashierId,
      branchId: cashierSessions.branchId,
      shiftTypeId: cashierSessions.shiftTypeId,
      scheduledStartTime: cashierSessions.scheduledStartTime,
      actualEndTime: cashierSessions.actualEndTime,
      openingBalancePsw: cashierSessions.openingBalancePsw,
      closingBalancePsw: cashierSessions.closingBalancePsw,
      status: cashierSessions.status,
      createdAt: cashierSessions.createdAt,
      updatedAt: cashierSessions.updatedAt,
    })
    .from(cashierSessions)
    .where(where.length ? and(...where) : undefined)
    .orderBy(...orderBy)
    .limit(p.limit)
    .offset(p.offset);

  return { data: rows, totalRecords };
}

export async function openSessionRepo(
  values: typeof cashierSessions.$inferInsert,
): Promise<{ id: string }> {
  const [row] = await db
    .insert(cashierSessions)
    .values(values)
    .returning({ id: cashierSessions.id });
  return row!;
}

export async function closeSessionRepo(
  id: string,
  patch: Pick<typeof cashierSessions.$inferInsert, 'actualEndTime' | 'closingBalancePsw' | 'status'>,
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
      shiftTypeId: cashierSessions.shiftTypeId,
      scheduledStartTime: cashierSessions.scheduledStartTime,
      actualEndTime: cashierSessions.actualEndTime,
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
