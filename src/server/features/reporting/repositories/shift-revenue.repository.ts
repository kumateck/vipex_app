import { and, asc, desc, eq, gte, inArray, isNull, lte } from 'drizzle-orm';
import { db } from '@/db/config';
import { branches, cashierSessions, parcels, payments, shiftTypes, users } from '@/db/schemas';
import { PaymentMethod } from '@/db/schemas/enums';

export async function listShiftRevenueSessionsRepo(input: {
  companyId: string;
  branchId?: string | null;
  shiftSessionId?: string | null;
  from: Date;
  to: Date;
}) {
  return db
    .select({
      id: cashierSessions.id,
      cashierId: cashierSessions.cashierId,
      cashierName: users.fullname,
      branchId: cashierSessions.branchId,
      branchName: branches.name,
      shiftTypeId: cashierSessions.shiftTypeId,
      shiftTypeName: shiftTypes.name,
      scheduledStartTime: cashierSessions.scheduledStartTime,
      scheduledEndTime: cashierSessions.scheduledEndTime,
      actualStartTime: cashierSessions.actualStartTime,
      actualEndTime: cashierSessions.actualEndTime,
      status: cashierSessions.status,
      openingBalancePsw: cashierSessions.openingBalancePsw,
      closingBalancePsw: cashierSessions.closingBalancePsw,
      totalTransactions: cashierSessions.totalTransactions,
    })
    .from(cashierSessions)
    .innerJoin(users, eq(users.id, cashierSessions.cashierId))
    .innerJoin(branches, eq(branches.id, cashierSessions.branchId))
    .leftJoin(shiftTypes, eq(shiftTypes.id, cashierSessions.shiftTypeId))
    .where(
      and(
        eq(users.companyId, input.companyId),
        gte(cashierSessions.scheduledStartTime, input.from),
        lte(cashierSessions.scheduledStartTime, input.to),
        ...(input.branchId ? [eq(cashierSessions.branchId, input.branchId)] : []),
        ...(input.shiftSessionId ? [eq(cashierSessions.id, input.shiftSessionId)] : []),
      ),
    )
    .orderBy(desc(cashierSessions.scheduledStartTime), desc(cashierSessions.id));
}

export async function listShiftRevenueTransactionRowsRepo(sessionIds: string[]) {
  if (!sessionIds.length) return [];

  return db
    .select({
      sessionId: parcels.cashierSessionId,
      paymentId: payments.id,
      method: payments.method,
      grossAmountPsw: payments.grossAmountPsw,
      netAmountPsw: payments.netAmountPsw,
      taxTotalPsw: payments.taxTotalPsw,
      receivedAt: payments.receivedAt,
    })
    .from(payments)
    .innerJoin(parcels, eq(parcels.id, payments.parcelId))
    .where(and(inArray(parcels.cashierSessionId, sessionIds), isNull(payments.voidedAt)))
    .orderBy(asc(payments.receivedAt), asc(payments.id));
}

export function categorizeShiftRevenueMethod(method: number, amountPsw: number) {
  if (method === PaymentMethod.CASH) {
    return { cashPsw: amountPsw, mobileMoneyPsw: 0, creditPsw: 0 };
  }
  if (method === PaymentMethod.CREDIT) {
    return { cashPsw: 0, mobileMoneyPsw: 0, creditPsw: amountPsw };
  }
  return { cashPsw: 0, mobileMoneyPsw: amountPsw, creditPsw: 0 };
}
