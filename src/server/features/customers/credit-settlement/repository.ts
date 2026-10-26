import { sql } from 'drizzle-orm';
import { db } from '@/db/config';
import {
  CustomerCreditSourceType,
  CustomerCreditTransactionType,
  ParcelStatus,
} from '@/db/schemas/enums';
import { effectiveChargeAmountSql } from './charge-amount';

export type CreditExecutor = Parameters<Parameters<typeof db.transaction>[0]>[0] | typeof db;
export type OpenParcelCharge = {
  sourceType: number;
  chargeTransactionId: string;
  parcelId: string;
  bookingCode: string;
  trackingCode: string;
  createdAt: string;
  chargeAmountPsw: number;
  allocatedAmountPsw: number;
  outstandingAmountPsw: number;
};

export async function listOpenParcelCharges(
  companyId: string,
  customerId: string,
  executor: CreditExecutor = db,
): Promise<OpenParcelCharge[]> {
  const rows = await executor.execute(sql`
    SELECT cct.id, cct.source_type, p.id AS parcel_id, p.booking_code, p.tracking_code, p.created_at,
      ${effectiveChargeAmountSql()} AS charge_amount_psw,
      COALESCE(a.amount_psw, 0) AS allocated_amount_psw
    FROM customer_credit_transactions cct
    JOIN parcels p ON p.id = cct.reference_id AND p.company_id = cct.company_id
    LEFT JOIN LATERAL (
      SELECT SUM(cca.amount_psw) AS amount_psw FROM customer_credit_allocations cca
      WHERE cca.charge_transaction_id = cct.id AND cca.company_id = cct.company_id
        AND cca.customer_id = cct.customer_id
    ) a ON true
    WHERE cct.company_id = ${companyId} AND cct.customer_id = ${customerId}
      AND cct.transaction_type = ${CustomerCreditTransactionType.CHARGE}
      AND cct.source_type IN (${CustomerCreditSourceType.PARCEL}, ${CustomerCreditSourceType.DELIVERY})
      AND p.is_deleted = false AND p.status <> ${ParcelStatus.CANCELLED}
    ORDER BY p.created_at, p.id, cct.id
  `);
  return rows
    .map((row) => ({
      sourceType: Number(row.source_type),
      chargeTransactionId: String(row.id),
      parcelId: String(row.parcel_id),
      bookingCode: String(row.booking_code),
      trackingCode: String(row.tracking_code),
      createdAt: new Date(row.created_at as string).toISOString(),
      chargeAmountPsw: Number(row.charge_amount_psw),
      allocatedAmountPsw: Number(row.allocated_amount_psw),
      outstandingAmountPsw: Number(row.charge_amount_psw) - Number(row.allocated_amount_psw),
    }))
    .filter((row) => row.outstandingAmountPsw > 0);
}
