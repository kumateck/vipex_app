import { and, desc, eq, gte, lte, or, sql } from 'drizzle-orm';
import { db } from '@/db/config';
import { effectiveChargeAmountSql } from '../credit-settlement';
import { parcels } from '@/db/schemas';
import { CustomerCreditTransactionType } from '@/db/schemas/enums';
import { type OpenCreditChargeRow } from './customer-credit.repository';

export async function listCustomerOpenCreditChargesRepo(input: {
  customerId: string;
  companyId: string;
}): Promise<OpenCreditChargeRow[]> {
  const rows = await db.execute(sql<{
    charge_transaction_id: string;
    created_at: Date;
    reference_id: string | null;
    notes: string | null;
    charge_amount_psw: string | number;
    allocated_amount_psw: string | number;
    outstanding_amount_psw: string | number;
  }>`
    WITH charge_rows AS (
      SELECT
        cct.id AS charge_transaction_id,
        cct.created_at,
        cct.reference_id,
        cct.notes,
        ${effectiveChargeAmountSql()}::bigint AS charge_amount_psw
      FROM customer_credit_transactions cct
      WHERE cct.customer_id = ${input.customerId}
        AND cct.company_id = ${input.companyId}
        AND cct.transaction_type = ${CustomerCreditTransactionType.CHARGE}
        AND cct.signed_amount_psw > 0
    ),
    allocations AS (
      SELECT
        cca.charge_transaction_id,
        COALESCE(SUM(cca.amount_psw), 0)::bigint AS allocated_amount_psw
      FROM customer_credit_allocations cca
      WHERE cca.customer_id = ${input.customerId}
        AND cca.company_id = ${input.companyId}
      GROUP BY cca.charge_transaction_id
    )
    SELECT
      cr.charge_transaction_id,
      cr.created_at,
      cr.reference_id,
      cr.notes,
      cr.charge_amount_psw,
      COALESCE(a.allocated_amount_psw, 0)::bigint AS allocated_amount_psw,
      (cr.charge_amount_psw - COALESCE(a.allocated_amount_psw, 0))::bigint AS outstanding_amount_psw
    FROM charge_rows cr
    LEFT JOIN allocations a ON a.charge_transaction_id = cr.charge_transaction_id
    WHERE (cr.charge_amount_psw - COALESCE(a.allocated_amount_psw, 0)) > 0
    ORDER BY cr.created_at ASC, cr.charge_transaction_id ASC
  `);

  return rows.map((row) => {
    const typed = row as {
      charge_transaction_id: string;
      created_at: string | Date;
      reference_id: string | null;
      notes: string | null;
      charge_amount_psw: string | number;
      allocated_amount_psw: string | number;
      outstanding_amount_psw: string | number;
    };
    return {
      chargeTransactionId: typed.charge_transaction_id,
      createdAt: new Date(typed.created_at),
      referenceId: typed.reference_id,
      notes: typed.notes,
      chargeAmountPsw: Number(typed.charge_amount_psw),
      allocatedAmountPsw: Number(typed.allocated_amount_psw),
      outstandingAmountPsw: Number(typed.outstanding_amount_psw),
    };
  });
}

export type CustomerStatementParcelRow = {
  id: string;
  companyId: string;
  bookingCode: string;
  trackingCode: string;
  chargeExemptCustomerType?: number | null;
  chargePsw: number;
  plannedToBePaidPsw: number;
  method: number;
  status: number;
  createdAt: Date;
};

export async function listCustomerStatementSentParcelsRepo(input: {
  customerId: string;
  companyId: string;
  dateFrom?: Date | null;
  dateTo?: Date | null;
  limit?: number;
}): Promise<CustomerStatementParcelRow[]> {
  return db
    .select({
      id: parcels.id,
      companyId: parcels.companyId,
      bookingCode: parcels.bookingCode,
      trackingCode: parcels.trackingCode,
      chargeExemptCustomerType: parcels.chargeExemptCustomerType,
      chargePsw: parcels.chargePsw,
      plannedToBePaidPsw: parcels.plannedToBePaidPsw,
      method: parcels.method,
      status: parcels.status,
      createdAt: parcels.createdAt,
    })
    .from(parcels)
    .where(
      and(
        eq(parcels.companyId, input.companyId),
        eq(parcels.senderId, input.customerId),
        eq(parcels.isDeleted, false),
        ...(input.dateFrom ? [gte(parcels.createdAt, input.dateFrom)] : []),
        ...(input.dateTo ? [lte(parcels.createdAt, input.dateTo)] : []),
      ),
    )
    .orderBy(desc(parcels.createdAt), desc(parcels.id))
    .limit(input.limit ?? 300);
}

export async function listCustomerStatementReceivedParcelsRepo(input: {
  customerId: string;
  companyId: string;
  dateFrom?: Date | null;
  dateTo?: Date | null;
  limit?: number;
}): Promise<CustomerStatementParcelRow[]> {
  return db
    .select({
      id: parcels.id,
      companyId: parcels.companyId,
      bookingCode: parcels.bookingCode,
      trackingCode: parcels.trackingCode,
      chargeExemptCustomerType: parcels.chargeExemptCustomerType,
      chargePsw: parcels.chargePsw,
      plannedToBePaidPsw: parcels.plannedToBePaidPsw,
      method: parcels.method,
      status: parcels.status,
      createdAt: parcels.createdAt,
    })
    .from(parcels)
    .where(
      and(
        eq(parcels.companyId, input.companyId),
        eq(parcels.isDeleted, false),
        or(
          eq(parcels.receiverId, input.customerId),
          eq(parcels.secondReceiverId, input.customerId),
        ),
        ...(input.dateFrom ? [gte(parcels.createdAt, input.dateFrom)] : []),
        ...(input.dateTo ? [lte(parcels.createdAt, input.dateTo)] : []),
      ),
    )
    .orderBy(desc(parcels.createdAt), desc(parcels.id))
    .limit(input.limit ?? 300);
}

export type CustomerStatementPaymentRow = {
  id: string;
  parcelId: string;
  bookingCode: string;
  trackingCode: string;
  payer: number;
  method: number;
  component: number;
  grossAmountPsw: number;
  receivedAt: Date;
  senderId: string;
  receiverId: string;
  secondReceiverId: string | null;
};
