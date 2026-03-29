import { and, asc, eq, inArray, isNull } from 'drizzle-orm';
import { db } from '@/db/config';
import { payments } from '@/db/schemas';

type DbExecutor = Parameters<Parameters<typeof db.transaction>[0]>[0] | typeof db;

export type PaymentRow = {
  id: string;
  companyId: string;
  branchId: string;
  parcelId: string;
  component: number;
  payer: number;
  cashierType: number;
  method: number;
  cashierUserId: string;
  grossAmountPsw: number;
  netAmountPsw: number;
  vatPsw: number;
  getfundPsw: number;
  nhilPsw: number;
  covidPsw: number;
  taxTotalPsw: number;
  receivedAt: Date;
  notes: string | null;
  receiptNo: string | null;
  voidedAt: Date | null;
  voidedBy: string | null;
  voidReason: string | null;
  createdAt: Date;
};

export async function createPaymentRepo(
  values: typeof payments.$inferInsert,
  executor: DbExecutor = db,
): Promise<{ id: string }> {
  const [row] = await executor.insert(payments).values(values).returning({ id: payments.id });
  if (!row) {
    throw new Error('Failed to create payment');
  }
  return row;
}

export async function listPaymentsForParcelRepo(
  parcelId: string,
  executor: DbExecutor = db,
): Promise<PaymentRow[]> {
  const rows = await executor
    .select({
      id: payments.id,
      companyId: payments.companyId,
      branchId: payments.branchId,
      parcelId: payments.parcelId,
      component: payments.component,
      payer: payments.payer,
      cashierType: payments.cashierType,
      method: payments.method,
      cashierUserId: payments.cashierUserId,
      grossAmountPsw: payments.grossAmountPsw,
      netAmountPsw: payments.netAmountPsw,
      vatPsw: payments.vatPsw,
      getfundPsw: payments.getfundPsw,
      nhilPsw: payments.nhilPsw,
      covidPsw: payments.covidPsw,
      taxTotalPsw: payments.taxTotalPsw,
      receivedAt: payments.receivedAt,
      notes: payments.notes,
      receiptNo: payments.receiptNo,
      voidedAt: payments.voidedAt,
      voidedBy: payments.voidedBy,
      voidReason: payments.voidReason,
      createdAt: payments.createdAt,
    })
    .from(payments)
    .where(and(eq(payments.parcelId, parcelId), isNull(payments.voidedAt)))
    .orderBy(asc(payments.receivedAt), asc(payments.id));
  return rows;
}

export async function listAllPaymentsForParcelRepo(
  parcelId: string,
  executor: DbExecutor = db,
): Promise<PaymentRow[]> {
  const rows = await executor
    .select({
      id: payments.id,
      companyId: payments.companyId,
      branchId: payments.branchId,
      parcelId: payments.parcelId,
      component: payments.component,
      payer: payments.payer,
      cashierType: payments.cashierType,
      method: payments.method,
      cashierUserId: payments.cashierUserId,
      grossAmountPsw: payments.grossAmountPsw,
      netAmountPsw: payments.netAmountPsw,
      vatPsw: payments.vatPsw,
      getfundPsw: payments.getfundPsw,
      nhilPsw: payments.nhilPsw,
      covidPsw: payments.covidPsw,
      taxTotalPsw: payments.taxTotalPsw,
      receivedAt: payments.receivedAt,
      notes: payments.notes,
      receiptNo: payments.receiptNo,
      voidedAt: payments.voidedAt,
      voidedBy: payments.voidedBy,
      voidReason: payments.voidReason,
      createdAt: payments.createdAt,
    })
    .from(payments)
    .where(eq(payments.parcelId, parcelId))
    .orderBy(asc(payments.receivedAt), asc(payments.id));
  return rows;
}

export async function softVoidPaymentsByIdsRepo(
  paymentIds: string[],
  actorUserId: string,
  reason: string,
  executor: DbExecutor = db,
): Promise<number> {
  if (paymentIds.length === 0) return 0;
  const rows = await executor
    .update(payments)
    .set({
      voidedAt: new Date(),
      voidedBy: actorUserId,
      voidReason: reason,
    })
    .where(and(inArray(payments.id, paymentIds), isNull(payments.voidedAt)))
    .returning({ id: payments.id });
  return rows.length;
}

export async function sumPaymentsForParcelComponentRepo(
  parcelId: string,
  component: number,
  executor: DbExecutor = db,
): Promise<number> {
  const rows = await listPaymentsForParcelRepo(parcelId, executor);
  return rows
    .filter((r) => r.component === component)
    .reduce<number>((acc, r) => acc + r.grossAmountPsw, 0);
}
