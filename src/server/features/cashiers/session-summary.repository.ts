import { and, eq, gte, isNull, lte, or, sql } from 'drizzle-orm';
import { db } from '@/db/config';
import { cashierSessions, parcels, payments, CashierType, PaymentComponent } from '@/db/schemas';

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

export async function getSessionCreditCreatedPswRepo(input: {
  sessionId: string;
  cashierId: string;
}): Promise<number> {
  const [row] = await db
    .select({
      total: sql<number>`coalesce(sum(${parcels.plannedToBePaidPsw}), 0)`,
    })
    .from(parcels)
    .innerJoin(cashierSessions, eq(cashierSessions.id, input.sessionId))
    .where(
      and(
        or(
          eq(parcels.cashierSessionId, input.sessionId),
          and(
            isNull(parcels.cashierSessionId),
            eq(parcels.createdBy, input.cashierId),
            eq(parcels.sourceId, cashierSessions.branchId),
            gte(parcels.createdAt, cashierSessions.scheduledStartTime),
            or(
              isNull(cashierSessions.actualEndTime),
              lte(parcels.createdAt, cashierSessions.actualEndTime),
            ),
          ),
        ),
        eq(parcels.isDeleted, false),
      ),
    );

  return Number(row?.total ?? 0);
}
