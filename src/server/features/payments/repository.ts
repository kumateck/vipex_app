import { and, asc, eq, isNull } from 'drizzle-orm';
import { db } from '@/db/config';
import { payments } from '@/db/schemas';

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
  grossAmountPsw: bigint;
  netAmountPsw: bigint;
  vatPsw: bigint;
  getfundPsw: bigint;
  nhilPsw: bigint;
  covidPsw: bigint;
  taxTotalPsw: bigint;
  receivedAt: Date;
  notes: string | null;
  receiptNo: string | null;
  voidedAt: Date | null;
  voidedBy: string | null;
  createdAt: Date;
};

export async function createPaymentRepo(
  values: typeof payments.$inferInsert,
): Promise<{ id: string }> {
  const [row] = await db.insert(payments).values(values).returning({ id: payments.id });
  return row;
}

export async function listPaymentsForParcelRepo(parcelId: string): Promise<PaymentRow[]> {
  const rows = await db
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
      createdAt: payments.createdAt,
    })
    .from(payments)
    .where(and(eq(payments.parcelId, parcelId), isNull(payments.voidedAt)))
    .orderBy(asc(payments.receivedAt), asc(payments.id));
  return rows;
}

export async function sumPaymentsForParcelComponentRepo(
  parcelId: string,
  component: number,
): Promise<bigint> {
  const rows = await listPaymentsForParcelRepo(parcelId);
  return rows
    .filter((r) => r.component === component)
    .reduce<bigint>((acc, r) => acc + r.grossAmountPsw, 0n);
}
