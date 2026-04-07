import { and, asc, count, desc, eq, gte, lt, lte, or, sql, isNull, inArray } from 'drizzle-orm';
import { db } from '@/db/config';
import {
  cashierSessionTypes,
  cashierSessions,
  parcels,
  payments,
  users,
  CashierType,
  PaymentComponent,
} from '@/db/schemas';
import type { SortField } from '@/server/types/pagination.types';
type DbExecutor = Parameters<Parameters<typeof db.transaction>[0]>[0] | typeof db;

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

export async function getSessionTypeRepo(id: string): Promise<{ id: string } | null> {
  const [row] = await db
    .select({ id: cashierSessionTypes.id })
    .from(cashierSessionTypes)
    .where(eq(cashierSessionTypes.id, id))
    .limit(1);
  return row ?? null;
}

export type SessionRow = {
  id: string;
  cashierId: string;
  cashierName: string | null;
  branchId: string;
  shiftTypeId: string | null;
  scheduledStartTime: Date;
  actualEndTime: Date | null;
  openingBalancePsw: number;
  totalReceivedPsw: number;
  currentBalancePsw: number;
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
  dateFrom?: string | null;
  dateTo?: string | null;
  sort?: SortField[] | null;
};

export async function listSessionsRepo(
  p: ListSessionsParams,
): Promise<{ data: SessionRow[]; totalRecords: number }> {
  const where: (ReturnType<typeof eq> | ReturnType<typeof and> | ReturnType<typeof or>)[] = [];
  if (p.cashierId) where.push(eq(cashierSessions.cashierId, p.cashierId));
  if (p.branchId) where.push(eq(cashierSessions.branchId, p.branchId));
  if (p.activeOnly) where.push(eq(cashierSessions.status, 'ACTIVE'));
  if (p.dateFrom) where.push(gte(cashierSessions.scheduledStartTime, new Date(p.dateFrom)));
  if (p.dateTo) where.push(lte(cashierSessions.scheduledStartTime, new Date(p.dateTo)));
  const sort = p.sort ?? [];
  const orderBy = sort.length
    ? sort
        .map((s) => {
          if (s.field === 'scheduledStartTime')
            return s.direction === 'desc'
              ? desc(cashierSessions.scheduledStartTime)
              : asc(cashierSessions.scheduledStartTime);
          if (s.field === 'createdAt')
            return s.direction === 'desc'
              ? desc(cashierSessions.createdAt)
              : asc(cashierSessions.createdAt);
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
      cashierName: users.fullname,
      branchId: cashierSessions.branchId,
      shiftTypeId: cashierSessions.shiftTypeId,
      scheduledStartTime: cashierSessions.scheduledStartTime,
      actualEndTime: cashierSessions.actualEndTime,
      openingBalancePsw: cashierSessions.openingBalancePsw,
      totalReceivedPsw: sql<number>`0`,
      currentBalancePsw: sql<number>`0`,
      closingBalancePsw: cashierSessions.closingBalancePsw,
      status: cashierSessions.status,
      createdAt: cashierSessions.createdAt,
      updatedAt: cashierSessions.updatedAt,
    })
    .from(cashierSessions)
    .leftJoin(users, eq(users.id, cashierSessions.cashierId))
    .where(where.length ? and(...where) : undefined)
    .orderBy(...orderBy)
    .limit(p.limit)
    .offset(p.offset);

  const sessionIds = rows.map((row) => row.id);
  const receivedBySession = new Map<string, number>();
  if (sessionIds.length) {
    const totals = await db
      .select({
        sessionId: parcels.cashierSessionId,
        totalReceivedPsw: sql<number>`coalesce(sum(${payments.grossAmountPsw}), 0)`,
      })
      .from(payments)
      .innerJoin(parcels, eq(parcels.id, payments.parcelId))
      .where(and(inArray(parcels.cashierSessionId, sessionIds), isNull(payments.voidedAt)))
      .groupBy(parcels.cashierSessionId);

    for (const item of totals) {
      if (!item.sessionId) continue;
      receivedBySession.set(item.sessionId, Number(item.totalReceivedPsw ?? 0));
    }
  }

  const data = rows.map((row) => {
    const totalReceivedPsw = receivedBySession.get(row.id) ?? 0;
    const currentBalancePsw =
      row.status === 'ACTIVE'
        ? Number(row.openingBalancePsw ?? 0) + totalReceivedPsw
        : Number(row.closingBalancePsw ?? row.openingBalancePsw ?? 0);

    return {
      ...row,
      totalReceivedPsw,
      currentBalancePsw,
    };
  });

  return { data, totalRecords };
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
  patch: Pick<
    typeof cashierSessions.$inferInsert,
    'actualEndTime' | 'closingBalancePsw' | 'status'
  >,
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
      cashierName: users.fullname,
      branchId: cashierSessions.branchId,
      shiftTypeId: cashierSessions.shiftTypeId,
      scheduledStartTime: cashierSessions.scheduledStartTime,
      actualEndTime: cashierSessions.actualEndTime,
      openingBalancePsw: cashierSessions.openingBalancePsw,
      totalReceivedPsw: sql<number>`0`,
      currentBalancePsw: sql<number>`0`,
      closingBalancePsw: cashierSessions.closingBalancePsw,
      status: cashierSessions.status,
      createdAt: cashierSessions.createdAt,
      updatedAt: cashierSessions.updatedAt,
    })
    .from(cashierSessions)
    .leftJoin(users, eq(users.id, cashierSessions.cashierId))
    .where(eq(cashierSessions.id, id))
    .limit(1);
  return row ?? null;
}

export async function findActiveSessionRepo(input: {
  cashierId: string;
  branchId?: string | null;
  executor?: DbExecutor;
}): Promise<SessionRow | null> {
  const executor = input.executor ?? db;
  const where = [
    eq(cashierSessions.cashierId, input.cashierId),
    eq(cashierSessions.status, 'ACTIVE'),
  ];
  if (input.branchId) {
    where.push(eq(cashierSessions.branchId, input.branchId));
  }

  const [row] = await executor
    .select({
      id: cashierSessions.id,
      cashierId: cashierSessions.cashierId,
      cashierName: users.fullname,
      branchId: cashierSessions.branchId,
      shiftTypeId: cashierSessions.shiftTypeId,
      scheduledStartTime: cashierSessions.scheduledStartTime,
      actualEndTime: cashierSessions.actualEndTime,
      openingBalancePsw: cashierSessions.openingBalancePsw,
      totalReceivedPsw: sql<number>`0`,
      currentBalancePsw: sql<number>`0`,
      closingBalancePsw: cashierSessions.closingBalancePsw,
      status: cashierSessions.status,
      createdAt: cashierSessions.createdAt,
      updatedAt: cashierSessions.updatedAt,
    })
    .from(cashierSessions)
    .leftJoin(users, eq(users.id, cashierSessions.cashierId))
    .where(and(...where))
    .orderBy(desc(cashierSessions.scheduledStartTime), desc(cashierSessions.id))
    .limit(1);

  return row ?? null;
}

export async function hasSameDayCompletedSessionRepo(input: {
  cashierId: string;
  branchId: string;
  day: Date;
}): Promise<boolean> {
  const dayStart = new Date(input.day);
  dayStart.setHours(0, 0, 0, 0);
  const nextDayStart = new Date(dayStart);
  nextDayStart.setDate(nextDayStart.getDate() + 1);

  const [row] = await db
    .select({ id: cashierSessions.id })
    .from(cashierSessions)
    .where(
      and(
        eq(cashierSessions.cashierId, input.cashierId),
        eq(cashierSessions.branchId, input.branchId),
        eq(cashierSessions.status, 'COMPLETED'),
        gte(cashierSessions.scheduledStartTime, dayStart),
        lt(cashierSessions.scheduledStartTime, nextDayStart),
      ),
    )
    .limit(1);

  return !!row;
}

export async function getSessionAmountPaidPswRepo(input: {
  sessionId: string;
  cashierId: string;
}): Promise<number> {
  const [row] = await db
    .select({
      total: sql<number>`coalesce(sum(${payments.grossAmountPsw}), 0)`,
    })
    .from(payments)
    .innerJoin(cashierSessions, eq(cashierSessions.id, input.sessionId))
    .where(
      and(
        eq(payments.cashierUserId, input.cashierId),
        eq(payments.branchId, cashierSessions.branchId),
        eq(payments.cashierType, CashierType.SENDING),
        gte(payments.receivedAt, cashierSessions.scheduledStartTime),
        or(
          isNull(cashierSessions.actualEndTime),
          lte(payments.receivedAt, cashierSessions.actualEndTime),
        ),
        isNull(payments.voidedAt),
      ),
    );

  return Number(row?.total ?? 0);
}

export async function getSessionToBePaidCollectedPswRepo(input: {
  sessionId: string;
  cashierId: string;
}): Promise<number> {
  const [row] = await db
    .select({
      total: sql<number>`coalesce(sum(${payments.grossAmountPsw}), 0)`,
    })
    .from(payments)
    .innerJoin(cashierSessions, eq(cashierSessions.id, input.sessionId))
    .where(
      and(
        eq(payments.cashierUserId, input.cashierId),
        eq(payments.branchId, cashierSessions.branchId),
        eq(payments.cashierType, CashierType.TOBEPAID),
        gte(payments.receivedAt, cashierSessions.scheduledStartTime),
        or(
          isNull(cashierSessions.actualEndTime),
          lte(payments.receivedAt, cashierSessions.actualEndTime),
        ),
        isNull(payments.voidedAt),
      ),
    );

  return Number(row?.total ?? 0);
}

export async function getSessionDeliveryFeeCollectedPswRepo(input: {
  sessionId: string;
  cashierId: string;
}): Promise<number> {
  const [row] = await db
    .select({
      total: sql<number>`coalesce(sum(${payments.grossAmountPsw}), 0)`,
    })
    .from(payments)
    .innerJoin(cashierSessions, eq(cashierSessions.id, input.sessionId))
    .where(
      and(
        eq(payments.cashierUserId, input.cashierId),
        eq(payments.branchId, cashierSessions.branchId),
        eq(payments.component, PaymentComponent.DELIVERY_FEE),
        gte(payments.receivedAt, cashierSessions.scheduledStartTime),
        or(
          isNull(cashierSessions.actualEndTime),
          lte(payments.receivedAt, cashierSessions.actualEndTime),
        ),
        isNull(payments.voidedAt),
      ),
    );

  return Number(row?.total ?? 0);
}

export async function getSessionDeliveryPrincipalCollectedPswRepo(input: {
  sessionId: string;
  cashierId: string;
}): Promise<number> {
  const [row] = await db
    .select({
      total: sql<number>`coalesce(sum(${payments.grossAmountPsw}), 0)`,
    })
    .from(payments)
    .innerJoin(cashierSessions, eq(cashierSessions.id, input.sessionId))
    .where(
      and(
        eq(payments.cashierUserId, input.cashierId),
        eq(payments.branchId, cashierSessions.branchId),
        eq(payments.cashierType, CashierType.DELIVERY),
        eq(payments.component, PaymentComponent.PRINCIPAL),
        gte(payments.receivedAt, cashierSessions.scheduledStartTime),
        or(
          isNull(cashierSessions.actualEndTime),
          lte(payments.receivedAt, cashierSessions.actualEndTime),
        ),
        isNull(payments.voidedAt),
      ),
    );

  return Number(row?.total ?? 0);
}

export async function getSessionFullCashierExpectedPswRepo(input: {
  sessionId: string;
  cashierId: string;
}): Promise<number> {
  const [senderRow] = await db
    .select({
      total: sql<number>`coalesce(sum(${payments.grossAmountPsw}), 0)`,
    })
    .from(payments)
    .innerJoin(cashierSessions, eq(cashierSessions.id, input.sessionId))
    .where(
      and(
        eq(payments.cashierUserId, input.cashierId),
        eq(payments.branchId, cashierSessions.branchId),
        eq(payments.cashierType, CashierType.SENDING),
        gte(payments.receivedAt, cashierSessions.scheduledStartTime),
        or(
          isNull(cashierSessions.actualEndTime),
          lte(payments.receivedAt, cashierSessions.actualEndTime),
        ),
        isNull(payments.voidedAt),
      ),
    );

  const [receiverIncomingRow] = await db
    .select({
      total: sql<number>`coalesce(sum(${payments.grossAmountPsw}), 0)`,
    })
    .from(payments)
    .innerJoin(cashierSessions, eq(cashierSessions.id, input.sessionId))
    .innerJoin(parcels, eq(parcels.id, payments.parcelId))
    .where(
      and(
        eq(payments.cashierUserId, input.cashierId),
        eq(payments.branchId, cashierSessions.branchId),
        eq(payments.cashierType, CashierType.TOBEPAID),
        eq(parcels.destinationId, cashierSessions.branchId),
        sql`${parcels.sourceId} <> ${cashierSessions.branchId}`,
        gte(payments.receivedAt, cashierSessions.scheduledStartTime),
        or(
          isNull(cashierSessions.actualEndTime),
          lte(payments.receivedAt, cashierSessions.actualEndTime),
        ),
        isNull(payments.voidedAt),
      ),
    );

  return Number(senderRow?.total ?? 0) + Number(receiverIncomingRow?.total ?? 0);
}

export async function getSessionCreditCreatedPswRepo(sessionId: string): Promise<number> {
  const [row] = await db
    .select({
      total: sql<number>`coalesce(sum(${parcels.plannedToBePaidPsw}), 0)`,
    })
    .from(parcels)
    .where(and(eq(parcels.cashierSessionId, sessionId), eq(parcels.isDeleted, false)));

  return Number(row?.total ?? 0);
}
