import {
  transactionPaidPrincipalSql,
  transactionCreditPaidSql,
} from '../transaction-payment-query';
import { and, count, desc, eq, gte, isNull, lte, or, sql } from 'drizzle-orm';
import { db } from '@/db/config';
import { customerCreditTransactions, parcels, payments } from '@/db/schemas';
import { type CustomerCreditTransactionRow } from './customer-credit.repository';
import { type CustomerStatementPaymentRow } from './customer-open-items.repository';

export async function listCustomerStatementPaymentsRepo(input: {
  customerId: string;
  companyId: string;
  dateFrom?: Date | null;
  dateTo?: Date | null;
  limit?: number;
}): Promise<CustomerStatementPaymentRow[]> {
  return db
    .select({
      id: payments.id,
      parcelId: payments.parcelId,
      bookingCode: parcels.bookingCode,
      trackingCode: parcels.trackingCode,
      payer: payments.payer,
      method: payments.method,
      component: payments.component,
      grossAmountPsw: payments.grossAmountPsw,
      receivedAt: payments.receivedAt,
      senderId: parcels.senderId,
      receiverId: parcels.receiverId,
      secondReceiverId: parcels.secondReceiverId,
    })
    .from(payments)
    .innerJoin(parcels, eq(parcels.id, payments.parcelId))
    .where(
      and(
        eq(payments.companyId, input.companyId),
        eq(parcels.companyId, input.companyId),
        isNull(payments.voidedAt),
        or(
          eq(parcels.senderId, input.customerId),
          eq(parcels.receiverId, input.customerId),
          eq(parcels.secondReceiverId, input.customerId),
        ),
        ...(input.dateFrom ? [gte(payments.receivedAt, input.dateFrom)] : []),
        ...(input.dateTo ? [lte(payments.receivedAt, input.dateTo)] : []),
      ),
    )
    .orderBy(desc(payments.receivedAt), desc(payments.id))
    .limit(input.limit ?? 500);
}

export async function getCustomerCreditBalanceBeforeDateRepo(input: {
  customerId: string;
  companyId: string;
  before: Date;
}): Promise<number> {
  const beforeIso = input.before.toISOString();

  const [row] = await db
    .select({
      balance: sql<number>`COALESCE(SUM(${customerCreditTransactions.signedAmountPsw}), 0)`,
    })
    .from(customerCreditTransactions)
    .where(
      and(
        eq(customerCreditTransactions.customerId, input.customerId),
        eq(customerCreditTransactions.companyId, input.companyId),
        sql`${customerCreditTransactions.createdAt} < ${beforeIso}`,
      ),
    );

  return Number(row?.balance ?? 0);
}

export async function listCustomerCreditTransactionsByDateRepo(input: {
  customerId: string;
  companyId: string;
  dateFrom?: Date | null;
  dateTo?: Date | null;
  limit?: number;
}): Promise<CustomerCreditTransactionRow[]> {
  return db
    .select({
      id: customerCreditTransactions.id,
      companyId: customerCreditTransactions.companyId,
      customerId: customerCreditTransactions.customerId,
      sourceType: customerCreditTransactions.sourceType,
      transactionType: customerCreditTransactions.transactionType,
      referenceId: customerCreditTransactions.referenceId,
      signedAmountPsw: customerCreditTransactions.signedAmountPsw,
      notes: customerCreditTransactions.notes,
      createdBy: customerCreditTransactions.createdBy,
      createdAt: customerCreditTransactions.createdAt,
    })
    .from(customerCreditTransactions)
    .where(
      and(
        eq(customerCreditTransactions.customerId, input.customerId),
        eq(customerCreditTransactions.companyId, input.companyId),
        ...(input.dateFrom ? [gte(customerCreditTransactions.createdAt, input.dateFrom)] : []),
        ...(input.dateTo ? [lte(customerCreditTransactions.createdAt, input.dateTo)] : []),
      ),
    )
    .orderBy(desc(customerCreditTransactions.createdAt), desc(customerCreditTransactions.id))
    .limit(input.limit ?? 500);
}

export type CustomerTransactionRow = {
  id: string;
  bookingCode: string;
  trackingCode: string;
  sourceId: string;
  destinationId: string;
  status: number;
  chargeExemptCustomerType?: number | null;
  chargePsw: number;
  paidPrincipalPsw: number;
  creditPaidPsw: number;
  method: number;
  senderId: string;
  receiverId: string;
  secondReceiverId: string | null;
  createdAt: Date;
};

export async function listCustomerTransactionsRepo(input: {
  customerId: string;
  companyId: string;
  dateFrom?: Date | null;
  dateTo?: Date | null;
  limit: number;
  offset: number;
}): Promise<{ data: CustomerTransactionRow[]; totalRecords: number }> {
  const where = and(
    eq(parcels.companyId, input.companyId),
    or(
      eq(parcels.senderId, input.customerId),
      eq(parcels.receiverId, input.customerId),
      eq(parcels.secondReceiverId, input.customerId),
    ),
    eq(parcels.isDeleted, false),
    ...(input.dateFrom ? [gte(parcels.createdAt, input.dateFrom)] : []),
    ...(input.dateTo ? [lte(parcels.createdAt, input.dateTo)] : []),
  );

  const [countRow] = await db.select({ c: count() }).from(parcels).where(where);
  const totalRecords = Number((countRow?.c as unknown as bigint) ?? 0n);

  const data = await db
    .select({
      id: parcels.id,
      bookingCode: parcels.bookingCode,
      trackingCode: parcels.trackingCode,
      sourceId: parcels.sourceId,
      destinationId: parcels.destinationId,
      status: parcels.status,
      chargeExemptCustomerType: parcels.chargeExemptCustomerType,
      chargePsw: parcels.chargePsw,
      paidPrincipalPsw: transactionPaidPrincipalSql,
      creditPaidPsw: transactionCreditPaidSql,
      method: parcels.method,
      senderId: parcels.senderId,
      receiverId: parcels.receiverId,
      secondReceiverId: parcels.secondReceiverId,
      createdAt: parcels.createdAt,
    })
    .from(parcels)
    .where(where)
    .orderBy(desc(parcels.createdAt), desc(parcels.id))
    .limit(input.limit)
    .offset(input.offset);

  return { data, totalRecords };
}

export type CustomerPaymentRow = {
  id: string;
  source: 'PARCEL_PAYMENT' | 'CREDIT_PAYMENT';
  amountPsw: number;
  method: number | null;
  bookingCode: string | null;
  trackingCode: string | null;
  notes: string | null;
  createdAt: Date;
};
