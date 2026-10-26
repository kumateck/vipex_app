import { sql } from 'drizzle-orm';
import { CustomerType, CustomerCreditTransactionType } from '@/db/schemas/enums';
import { effectiveChargeAmountSql } from '../customers/credit-settlement';

export const walletAccountCte = (companyId: string) => sql`
    WITH alloc AS (
      SELECT
        cca.charge_transaction_id,
        COALESCE(SUM(cca.amount_psw), 0)::bigint AS allocated_psw
      FROM customer_credit_allocations cca
      WHERE cca.company_id = ${companyId}
      GROUP BY cca.charge_transaction_id
    ),
    open_charges AS (
      SELECT
        cct.customer_id,
        COUNT(*) FILTER (
          WHERE (${effectiveChargeAmountSql()} - COALESCE(a.allocated_psw, 0)) > 0
        )::int AS open_items_count,
        COALESCE(
          SUM(GREATEST(${effectiveChargeAmountSql()} - COALESCE(a.allocated_psw, 0), 0)),
          0
        )::bigint AS outstanding_psw,
        MIN(cct.created_at) FILTER (
          WHERE (${effectiveChargeAmountSql()} - COALESCE(a.allocated_psw, 0)) > 0
        ) AS oldest_open_charge_at
      FROM customer_credit_transactions cct
      LEFT JOIN alloc a ON a.charge_transaction_id = cct.id
      WHERE cct.company_id = ${companyId}
        AND cct.transaction_type = ${CustomerCreditTransactionType.CHARGE}
        AND cct.signed_amount_psw > 0
      GROUP BY cct.customer_id
    ),
    balances AS (
      SELECT
        cct.customer_id,
        COALESCE(SUM(cct.signed_amount_psw), 0)::bigint AS balance_psw
      FROM customer_credit_transactions cct
      WHERE cct.company_id = ${companyId}
      GROUP BY cct.customer_id
    ),
    base AS (
      SELECT
        c.id AS customer_id,
        c.fullname,
        c.telephone,
        c.telephone2,
        c.email,
        c.customer_type,
        c.credit_eligible,
        c.credit_limit_psw,
        c.payment_terms_days,
        COALESCE(b.balance_psw, 0)::bigint AS balance_psw,
        COALESCE(oc.outstanding_psw, 0)::bigint AS outstanding_psw,
        COALESCE(oc.open_items_count, 0)::int AS open_items_count,
        oc.oldest_open_charge_at,
        CASE
          WHEN oc.oldest_open_charge_at IS NULL THEN 0
          ELSE GREATEST(
            FLOOR(
              EXTRACT(
                EPOCH FROM (
                  NOW() - (
                    oc.oldest_open_charge_at + (c.payment_terms_days || ' days')::interval
                  )
                )
              ) / 86400
            ),
            0
          )::int
        END AS overdue_days,
        CASE
          WHEN c.credit_eligible = true
            AND oc.oldest_open_charge_at IS NOT NULL
            AND NOW() > (oc.oldest_open_charge_at + (c.payment_terms_days || ' days')::interval)
            THEN 'BLOCK_RECOMMENDED'
          WHEN c.credit_eligible = false
            AND (
              oc.oldest_open_charge_at IS NULL
              OR NOW() <= (oc.oldest_open_charge_at + (c.payment_terms_days || ' days')::interval)
            )
            THEN 'UNBLOCK_RECOMMENDED'
          ELSE 'NONE'
        END AS approval_status
      FROM customers c
      LEFT JOIN balances b ON b.customer_id = c.id
      LEFT JOIN open_charges oc ON oc.customer_id = c.id
      WHERE c.company_id = ${companyId}
        AND c.is_deleted = false
        AND c.customer_type = ${CustomerType.BUSINESS}
    )
`;
