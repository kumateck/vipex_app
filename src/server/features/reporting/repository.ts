import { and, asc, desc, eq, gte, inArray, isNull, lt } from 'drizzle-orm';
import { db } from '@/db/config';
import { cashierSessions, parcels, payments, users } from '@/db/schemas';

export type CashierSessionReportRow = {
  id: string;
  cashierId: string;
  branchId: string;
  scheduledStartTime: Date;
  actualEndTime: Date | null;
  openingBalancePsw: number;
  closingBalancePsw: number | null;
  status: string;
};

export type CashierSessionTransactionRow = {
  sessionId: string | null;
  paymentId: string;
  parcelId: string;
  trackingCode: string;
  method: number;
  component: number;
  payer: number;
  cashierType: number;
  grossAmountPsw: number;
  netAmountPsw: number;
  taxTotalPsw: number;
  receivedAt: Date;
  receiptNo: string | null;
};

export async function listCashierSessionsForDayRepo(input: {
  companyId: string;
  cashierId: string;
  date: Date;
  branchId?: string | null;
}): Promise<CashierSessionReportRow[]> {
  const dayStart = new Date(input.date);
  dayStart.setHours(0, 0, 0, 0);
  const nextDayStart = new Date(dayStart);
  nextDayStart.setDate(nextDayStart.getDate() + 1);

  const where = [
    eq(cashierSessions.cashierId, input.cashierId),
    eq(users.companyId, input.companyId),
    gte(cashierSessions.scheduledStartTime, dayStart),
    lt(cashierSessions.scheduledStartTime, nextDayStart),
  ];

  if (input.branchId) {
    where.push(eq(cashierSessions.branchId, input.branchId));
  }

  return db
    .select({
      id: cashierSessions.id,
      cashierId: cashierSessions.cashierId,
      branchId: cashierSessions.branchId,
      scheduledStartTime: cashierSessions.scheduledStartTime,
      actualEndTime: cashierSessions.actualEndTime,
      openingBalancePsw: cashierSessions.openingBalancePsw,
      closingBalancePsw: cashierSessions.closingBalancePsw,
      status: cashierSessions.status,
    })
    .from(cashierSessions)
    .innerJoin(users, eq(users.id, cashierSessions.cashierId))
    .where(and(...where))
    .orderBy(desc(cashierSessions.scheduledStartTime), desc(cashierSessions.id));
}

export async function listSessionTransactionsRepo(sessionIds: string[]): Promise<CashierSessionTransactionRow[]> {
  if (!sessionIds.length) return [];

  return db
    .select({
      sessionId: parcels.cashierSessionId,
      paymentId: payments.id,
      parcelId: payments.parcelId,
      trackingCode: parcels.trackingCode,
      method: payments.method,
      component: payments.component,
      payer: payments.payer,
      cashierType: payments.cashierType,
      grossAmountPsw: payments.grossAmountPsw,
      netAmountPsw: payments.netAmountPsw,
      taxTotalPsw: payments.taxTotalPsw,
      receivedAt: payments.receivedAt,
      receiptNo: payments.receiptNo,
    })
    .from(payments)
    .innerJoin(parcels, eq(parcels.id, payments.parcelId))
    .where(
      and(
        inArray(parcels.cashierSessionId, sessionIds),
        isNull(payments.voidedAt),
      ),
    )
    .orderBy(asc(payments.receivedAt), asc(payments.id));
}
