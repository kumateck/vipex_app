import { and, desc, eq, gte, isNull, lte, or, sql } from 'drizzle-orm';
import { db } from '@/db/config';
import { customerCreditTransactions, parcels, payments } from '@/db/schemas';
import { CustomerCreditTransactionType, Payer } from '@/db/schemas/enums';
import { type CustomerPaymentRow } from './customer-statement.repository';

export async function listCustomerParcelPaymentsRepo(input: {
  customerId: string;
  companyId: string;
  dateFrom?: Date | null;
  dateTo?: Date | null;
  limit?: number;
}): Promise<CustomerPaymentRow[]> {
  const rows = await db
    .select({
      id: payments.id,
      amountPsw: payments.grossAmountPsw,
      method: payments.method,
      bookingCode: parcels.bookingCode,
      trackingCode: parcels.trackingCode,
      notes: payments.notes,
      createdAt: payments.receivedAt,
    })
    .from(payments)
    .innerJoin(parcels, eq(parcels.id, payments.parcelId))
    .where(
      and(
        eq(payments.companyId, input.companyId),
        eq(parcels.companyId, input.companyId),
        isNull(payments.voidedAt),
        or(
          and(eq(payments.payer, Payer.SENDER), eq(parcels.senderId, input.customerId)),
          and(
            eq(payments.payer, Payer.RECIPIENT),
            or(
              eq(parcels.receiverId, input.customerId),
              eq(parcels.secondReceiverId, input.customerId),
            ),
          ),
        ),
        ...(input.dateFrom ? [gte(payments.receivedAt, input.dateFrom)] : []),
        ...(input.dateTo ? [lte(payments.receivedAt, input.dateTo)] : []),
      ),
    )
    .orderBy(desc(payments.receivedAt), desc(payments.id))
    .limit(input.limit ?? 1000);

  return rows.map((row) => ({
    id: row.id,
    source: 'PARCEL_PAYMENT',
    amountPsw: row.amountPsw,
    method: row.method,
    bookingCode: row.bookingCode,
    trackingCode: row.trackingCode,
    notes: row.notes,
    createdAt: row.createdAt,
  }));
}

export async function listCustomerCreditPaymentsRepo(input: {
  customerId: string;
  companyId: string;
  dateFrom?: Date | null;
  dateTo?: Date | null;
  limit?: number;
}): Promise<CustomerPaymentRow[]> {
  const rows = await db
    .select({
      id: customerCreditTransactions.id,
      amountPsw: customerCreditTransactions.signedAmountPsw,
      notes: customerCreditTransactions.notes,
      createdAt: customerCreditTransactions.createdAt,
    })
    .from(customerCreditTransactions)
    .where(
      and(
        eq(customerCreditTransactions.customerId, input.customerId),
        eq(customerCreditTransactions.companyId, input.companyId),
        eq(customerCreditTransactions.transactionType, CustomerCreditTransactionType.PAYMENT),
        ...(input.dateFrom ? [gte(customerCreditTransactions.createdAt, input.dateFrom)] : []),
        ...(input.dateTo ? [lte(customerCreditTransactions.createdAt, input.dateTo)] : []),
      ),
    )
    .orderBy(desc(customerCreditTransactions.createdAt), desc(customerCreditTransactions.id))
    .limit(input.limit ?? 1000);

  return rows.map((row) => ({
    id: row.id,
    source: 'CREDIT_PAYMENT',
    amountPsw: Math.abs(row.amountPsw),
    method: null,
    bookingCode: null,
    trackingCode: null,
    notes: row.notes,
    createdAt: row.createdAt,
  }));
}

export type CustomerTransactionsMonthlyRow = {
  month: number;
  sentCount: number;
  receivedCount: number;
  sentAmountPsw: number;
  receivedAmountPsw: number;
};

export async function listCustomerTransactionsMonthlyRepo(input: {
  customerId: string;
  companyId: string;
  year: number;
}): Promise<CustomerTransactionsMonthlyRow[]> {
  const dateFromIso = new Date(Date.UTC(input.year, 0, 1, 0, 0, 0, 0)).toISOString();
  const dateToIso = new Date(Date.UTC(input.year, 11, 31, 23, 59, 59, 999)).toISOString();

  const rows = await db.execute(sql<{
    month: number | string;
    sent_count: number | string;
    received_count: number | string;
    sent_amount_psw: number | string;
    received_amount_psw: number | string;
  }>`
    SELECT
      EXTRACT(MONTH FROM p.created_at)::int AS month,
      COALESCE(SUM(CASE WHEN p.sender_id = ${input.customerId} THEN 1 ELSE 0 END), 0)::int AS sent_count,
      COALESCE(SUM(CASE WHEN (p.receiver_id = ${input.customerId} OR p.second_receiver_id = ${input.customerId}) THEN 1 ELSE 0 END), 0)::int AS received_count,
      COALESCE(SUM(CASE WHEN p.sender_id = ${input.customerId} THEN p.charge_psw ELSE 0 END), 0)::bigint AS sent_amount_psw,
      COALESCE(SUM(CASE WHEN (p.receiver_id = ${input.customerId} OR p.second_receiver_id = ${input.customerId}) THEN p.planned_tobepaid_psw ELSE 0 END), 0)::bigint AS received_amount_psw
    FROM parcels p
    WHERE p.company_id = ${input.companyId}
      AND p.is_deleted = false
      AND p.created_at >= ${dateFromIso}
      AND p.created_at <= ${dateToIso}
      AND (
        p.sender_id = ${input.customerId}
        OR p.receiver_id = ${input.customerId}
        OR p.second_receiver_id = ${input.customerId}
      )
    GROUP BY EXTRACT(MONTH FROM p.created_at)
    ORDER BY month ASC
  `);

  return rows.map((row) => {
    const typed = row as {
      month: number | string;
      sent_count: number | string;
      received_count: number | string;
      sent_amount_psw: number | string;
      received_amount_psw: number | string;
    };
    return {
      month: Number(typed.month),
      sentCount: Number(typed.sent_count),
      receivedCount: Number(typed.received_count),
      sentAmountPsw: Number(typed.sent_amount_psw),
      receivedAmountPsw: Number(typed.received_amount_psw),
    };
  });
}
