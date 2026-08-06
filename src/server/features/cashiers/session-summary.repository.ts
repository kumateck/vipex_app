import { and, eq, gte, isNull, lte, or, sql } from 'drizzle-orm';
import { db } from '@/db/config';
import {
  cashierSessions,
  customerCreditTransactions,
  parcels,
  payments,
  CashierType,
  CustomerCreditSourceType,
  CustomerCreditTransactionType,
  ParcelStatus,
  PaymentMethod,
  Payer,
  PaymentComponent,
} from '@/db/schemas';

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
        isNull(payments.momoTransactionId),
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
        isNull(payments.momoTransactionId),
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
        isNull(payments.momoTransactionId),
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
        isNull(payments.momoTransactionId),
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
        isNull(payments.momoTransactionId),
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
        isNull(payments.momoTransactionId),
      ),
    );

  return Number(senderRow?.total ?? 0) + Number(receiverIncomingRow?.total ?? 0);
}

export async function getSessionToBePaidCreatedPswRepo(input: {
  sessionId: string;
  cashierId: string;
}): Promise<number> {
  const senderPrincipalPaidPsw = sql<number>`coalesce((
    select sum(${payments.grossAmountPsw})
    from ${payments}
    where ${payments.parcelId} = ${parcels.id}
      and ${payments.component} = ${PaymentComponent.PRINCIPAL}
      and ${payments.payer} = ${Payer.SENDER}
      and ${payments.voidedAt} is null
  ), 0)`;
  const outstandingPrincipalPsw = sql<number>`case
    when ${parcels.plannedToBePaidPsw} > 0 then ${parcels.plannedToBePaidPsw}
    else greatest(${parcels.chargePsw} - ${senderPrincipalPaidPsw}, 0)
  end`;

  const [row] = await db
    .select({
      total: sql<number>`coalesce(sum(${outstandingPrincipalPsw}), 0)`,
    })
    .from(parcels)
    .innerJoin(cashierSessions, eq(cashierSessions.id, input.sessionId))
    .where(
      and(
        or(
          eq(parcels.cashierSessionId, input.sessionId),
          and(
            isNull(parcels.cashierSessionId),
            eq(parcels.sourceId, cashierSessions.branchId),
            eq(parcels.status, ParcelStatus.PROCESSED),
            gte(parcels.updatedAt, cashierSessions.scheduledStartTime),
            or(
              isNull(cashierSessions.actualEndTime),
              lte(parcels.updatedAt, cashierSessions.actualEndTime),
            ),
          ),
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
        sql`${parcels.method} <> ${PaymentMethod.CREDIT}`,
      ),
    );

  return Number(row?.total ?? 0);
}

export async function getSessionCreditCreatedPswRepo(input: {
  sessionId: string;
  cashierId: string;
}): Promise<number> {
  const [row] = await db
    .select({
      total: sql<number>`coalesce(sum(${customerCreditTransactions.signedAmountPsw}), 0)`,
    })
    .from(customerCreditTransactions)
    .innerJoin(cashierSessions, eq(cashierSessions.id, input.sessionId))
    .where(
      and(
        eq(customerCreditTransactions.createdBy, input.cashierId),
        eq(customerCreditTransactions.sourceType, CustomerCreditSourceType.PARCEL),
        eq(customerCreditTransactions.transactionType, CustomerCreditTransactionType.CHARGE),
        gte(customerCreditTransactions.createdAt, cashierSessions.scheduledStartTime),
        or(
          isNull(cashierSessions.actualEndTime),
          lte(customerCreditTransactions.createdAt, cashierSessions.actualEndTime),
        ),
      ),
    );

  return Number(row?.total ?? 0);
}
