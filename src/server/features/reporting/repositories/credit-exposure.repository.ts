import { sql } from 'drizzle-orm';
import { db } from '@/db/config';
import { CustomerCreditTransactionType } from '@/db/schemas/enums';
import type { CreditExposureReportRow, CustomerCreditAgingDetailReportRow } from '../types';

export async function listCreditExposureReportRowsRepo(input: { companyId: string }) {
  const rows = await db.execute(sql<{
    customer_id: string;
    customer_name: string;
    telephone: string | null;
    credit_limit_psw: string | number;
    outstanding_psw: string | number;
    oldest_charge_at: string | Date | null;
    bucket_current_psw: string | number;
    bucket_1_30_psw: string | number;
    bucket_31_60_psw: string | number;
    bucket_61_90_psw: string | number;
    bucket_91_plus_psw: string | number;
  }>`
    WITH charge_rows AS (
      SELECT
        cct.customer_id,
        cct.id AS charge_transaction_id,
        cct.created_at,
        cct.signed_amount_psw::bigint AS charge_amount_psw
      FROM customer_credit_transactions cct
      WHERE cct.company_id = ${input.companyId}
        AND cct.transaction_type = ${CustomerCreditTransactionType.CHARGE}
        AND cct.signed_amount_psw > 0
    ),
    allocations AS (
      SELECT
        cca.charge_transaction_id,
        COALESCE(SUM(cca.amount_psw), 0)::bigint AS allocated_amount_psw
      FROM customer_credit_allocations cca
      WHERE cca.company_id = ${input.companyId}
      GROUP BY cca.charge_transaction_id
    ),
    outstanding AS (
      SELECT
        cr.customer_id,
        cr.created_at,
        (cr.charge_amount_psw - COALESCE(a.allocated_amount_psw, 0))::bigint AS outstanding_amount_psw,
        GREATEST((CURRENT_DATE - cr.created_at::date), 0) AS age_days
      FROM charge_rows cr
      LEFT JOIN allocations a ON a.charge_transaction_id = cr.charge_transaction_id
      WHERE (cr.charge_amount_psw - COALESCE(a.allocated_amount_psw, 0)) > 0
    )
    SELECT
      c.id AS customer_id,
      c.fullname AS customer_name,
      c.telephone,
      c.credit_limit_psw,
      COALESCE(SUM(o.outstanding_amount_psw), 0)::bigint AS outstanding_psw,
      MIN(o.created_at) AS oldest_charge_at,
      COALESCE(SUM(CASE WHEN o.age_days = 0 THEN o.outstanding_amount_psw ELSE 0 END), 0)::bigint AS bucket_current_psw,
      COALESCE(SUM(CASE WHEN o.age_days BETWEEN 1 AND 30 THEN o.outstanding_amount_psw ELSE 0 END), 0)::bigint AS bucket_1_30_psw,
      COALESCE(SUM(CASE WHEN o.age_days BETWEEN 31 AND 60 THEN o.outstanding_amount_psw ELSE 0 END), 0)::bigint AS bucket_31_60_psw,
      COALESCE(SUM(CASE WHEN o.age_days BETWEEN 61 AND 90 THEN o.outstanding_amount_psw ELSE 0 END), 0)::bigint AS bucket_61_90_psw,
      COALESCE(SUM(CASE WHEN o.age_days > 90 THEN o.outstanding_amount_psw ELSE 0 END), 0)::bigint AS bucket_91_plus_psw
    FROM customers c
    INNER JOIN outstanding o ON o.customer_id = c.id
    WHERE c.company_id = ${input.companyId}
      AND c.is_deleted = false
    GROUP BY c.id, c.fullname, c.telephone, c.credit_limit_psw
    ORDER BY outstanding_psw DESC, c.fullname ASC
  `);

  return rows.map((row) => ({
    customerId: row.customer_id,
    customerName: row.customer_name,
    telephone: row.telephone,
    creditLimitPsw: Number(row.credit_limit_psw),
    outstandingPsw: Number(row.outstanding_psw),
    oldestChargeAt:
      row.oldest_charge_at &&
      (typeof row.oldest_charge_at === 'string' || row.oldest_charge_at instanceof Date)
        ? new Date(row.oldest_charge_at)
        : null,
    bucketCurrentPsw: Number(row.bucket_current_psw),
    bucket1To30Psw: Number(row.bucket_1_30_psw),
    bucket31To60Psw: Number(row.bucket_31_60_psw),
    bucket61To90Psw: Number(row.bucket_61_90_psw),
    bucket91PlusPsw: Number(row.bucket_91_plus_psw),
  })) as CreditExposureReportRow[];
}

export async function listCustomerCreditAgingDetailReportRowsRepo(input: {
  companyId: string;
  customerId?: string | null;
  agingBucket?: string | null;
  from?: Date | null;
  to?: Date | null;
}) {
  const rows = await db.execute(sql<{
    customer_id: string;
    customer_name: string;
    telephone: string | null;
    charge_transaction_id: string;
    charge_created_at: string | Date;
    source_type: number;
    reference_id: string | null;
    notes: string | null;
    charge_amount_psw: string | number;
    allocated_amount_psw: string | number;
    outstanding_amount_psw: string | number;
    age_days: number;
    aging_bucket: 'current' | '1-30' | '31-60' | '61-90' | '91+';
  }>`
    WITH charge_rows AS (
      SELECT
        cct.id AS charge_transaction_id,
        cct.customer_id,
        cct.created_at,
        cct.source_type,
        cct.reference_id,
        cct.notes,
        cct.signed_amount_psw::bigint AS charge_amount_psw
      FROM customer_credit_transactions cct
      WHERE cct.company_id = ${input.companyId}
        AND cct.transaction_type = ${CustomerCreditTransactionType.CHARGE}
        AND cct.signed_amount_psw > 0
        ${input.customerId ? sql`AND cct.customer_id = ${input.customerId}` : sql``}
        ${input.from ? sql`AND cct.created_at >= ${input.from}` : sql``}
        ${input.to ? sql`AND cct.created_at <= ${input.to}` : sql``}
    ),
    allocations AS (
      SELECT
        cca.charge_transaction_id,
        COALESCE(SUM(cca.amount_psw), 0)::bigint AS allocated_amount_psw
      FROM customer_credit_allocations cca
      WHERE cca.company_id = ${input.companyId}
      GROUP BY cca.charge_transaction_id
    ),
    outstanding AS (
      SELECT
        cr.customer_id,
        cr.charge_transaction_id,
        cr.created_at,
        cr.source_type,
        cr.reference_id,
        cr.notes,
        cr.charge_amount_psw,
        COALESCE(a.allocated_amount_psw, 0)::bigint AS allocated_amount_psw,
        (cr.charge_amount_psw - COALESCE(a.allocated_amount_psw, 0))::bigint AS outstanding_amount_psw,
        GREATEST((CURRENT_DATE - cr.created_at::date), 0) AS age_days
      FROM charge_rows cr
      LEFT JOIN allocations a ON a.charge_transaction_id = cr.charge_transaction_id
      WHERE (cr.charge_amount_psw - COALESCE(a.allocated_amount_psw, 0)) > 0
    )
    SELECT
      c.id AS customer_id,
      c.fullname AS customer_name,
      c.telephone,
      o.charge_transaction_id,
      o.created_at AS charge_created_at,
      o.source_type,
      o.reference_id,
      o.notes,
      o.charge_amount_psw,
      o.allocated_amount_psw,
      o.outstanding_amount_psw,
      o.age_days,
      CASE
        WHEN o.age_days = 0 THEN 'current'
        WHEN o.age_days BETWEEN 1 AND 30 THEN '1-30'
        WHEN o.age_days BETWEEN 31 AND 60 THEN '31-60'
        WHEN o.age_days BETWEEN 61 AND 90 THEN '61-90'
        ELSE '91+'
      END AS aging_bucket
    FROM outstanding o
    INNER JOIN customers c ON c.id = o.customer_id
    WHERE c.company_id = ${input.companyId}
      AND c.is_deleted = false
      ${
        input.agingBucket
          ? sql`AND CASE
              WHEN o.age_days = 0 THEN 'current'
              WHEN o.age_days BETWEEN 1 AND 30 THEN '1-30'
              WHEN o.age_days BETWEEN 31 AND 60 THEN '31-60'
              WHEN o.age_days BETWEEN 61 AND 90 THEN '61-90'
              ELSE '91+'
            END = ${input.agingBucket}`
          : sql``
      }
    ORDER BY o.age_days DESC, o.created_at ASC, c.fullname ASC
  `);

  return rows.map((row) => ({
    customerId: row.customer_id,
    customerName: row.customer_name,
    telephone: row.telephone,
    chargeTransactionId: row.charge_transaction_id,
    chargeCreatedAt:
      typeof row.charge_created_at === 'string' || row.charge_created_at instanceof Date
        ? new Date(row.charge_created_at)
        : new Date(String(row.charge_created_at)),
    sourceType: Number(row.source_type),
    referenceId: row.reference_id,
    notes: row.notes,
    chargeAmountPsw: Number(row.charge_amount_psw),
    allocatedAmountPsw: Number(row.allocated_amount_psw),
    outstandingAmountPsw: Number(row.outstanding_amount_psw),
    ageDays: Number(row.age_days),
    agingBucket: row.aging_bucket,
  })) as CustomerCreditAgingDetailReportRow[];
}
