import { sql } from 'drizzle-orm';
import { db } from '@/db/config';
import { walletAccountCte } from './wallet-account-query';

export type CustomerWalletAccountRow = {
  customerId: string;
  fullname: string;
  telephone: string | null;
  email: string | null;
  customerType: number;
  creditEligible: boolean;
  creditLimitPsw: number;
  paymentTermsDays: number;
  balancePsw: number;
  outstandingPsw: number;
  openItemsCount: number;
  oldestOpenChargeAt: Date | null;
  overdueDays: number;
  approvalStatus: 'NONE' | 'BLOCK_RECOMMENDED' | 'UNBLOCK_RECOMMENDED';
};

type ListCustomerWalletAccountsParams = {
  companyId: string;
  search?: string | null;
  creditEligible?: boolean | null;
  overdueOnly?: boolean;
  approvalOnly?: boolean;
  limit: number;
  offset: number;
};

function buildWalletWhereSql(input: {
  search?: string | null;
  creditEligible?: boolean | null;
  overdueOnly?: boolean;
  approvalOnly?: boolean;
}) {
  const clauses = [sql`1=1`];

  if (input.search?.trim()) {
    const term = `%${input.search.trim()}%`;
    clauses.push(
      sql`(
        base.fullname ILIKE ${term}
        OR COALESCE(base.telephone, '') ILIKE ${term}
        OR COALESCE(base.telephone2, '') ILIKE ${term}
        OR COALESCE(base.email, '') ILIKE ${term}
      )`,
    );
  }

  if (input.creditEligible !== undefined && input.creditEligible !== null) {
    clauses.push(sql`base.credit_eligible = ${input.creditEligible}`);
  }

  if (input.overdueOnly) {
    clauses.push(sql`base.overdue_days > 0`);
  }

  if (input.approvalOnly) {
    clauses.push(sql`base.approval_status <> 'NONE'`);
  }

  return sql.join(clauses, sql` AND `);
}

export async function listCustomerWalletAccountsRepo(
  params: ListCustomerWalletAccountsParams,
): Promise<{ data: CustomerWalletAccountRow[]; totalRecords: number }> {
  const whereSql = buildWalletWhereSql(params);

  const rows = await db.execute(sql<{
    customer_id: string;
    fullname: string;
    telephone: string | null;
    email: string | null;
    customer_type: number;
    credit_eligible: boolean;
    credit_limit_psw: string | number;
    payment_terms_days: number;
    balance_psw: string | number;
    outstanding_psw: string | number;
    open_items_count: number;
    oldest_open_charge_at: Date | string | null;
    overdue_days: number;
    approval_status: 'NONE' | 'BLOCK_RECOMMENDED' | 'UNBLOCK_RECOMMENDED';
  }>`
    ${walletAccountCte(params.companyId)}
    SELECT
      base.customer_id,
      base.fullname,
      base.telephone,
      base.email,
      base.customer_type,
      base.credit_eligible,
      base.credit_limit_psw,
      base.payment_terms_days,
      base.balance_psw,
      base.outstanding_psw,
      base.open_items_count,
      base.oldest_open_charge_at,
      base.overdue_days,
      base.approval_status
    FROM base
    WHERE ${whereSql}
    ORDER BY base.overdue_days DESC, base.outstanding_psw DESC, base.fullname ASC
    LIMIT ${params.limit}
    OFFSET ${params.offset}
  `);

  const countRows = await db.execute(sql<{ total_records: string | number }>`
    ${walletAccountCte(params.companyId)}
    SELECT COUNT(*)::bigint AS total_records
    FROM base
    WHERE ${whereSql}
  `);

  const data = rows.map((row) => {
    const typed = row as {
      customer_id: string;
      fullname: string;
      telephone: string | null;
      email: string | null;
      customer_type: number;
      credit_eligible: boolean;
      credit_limit_psw: string | number;
      payment_terms_days: number;
      balance_psw: string | number;
      outstanding_psw: string | number;
      open_items_count: number;
      oldest_open_charge_at: Date | string | null;
      overdue_days: number;
      approval_status: 'NONE' | 'BLOCK_RECOMMENDED' | 'UNBLOCK_RECOMMENDED';
    };

    return {
      customerId: typed.customer_id,
      fullname: typed.fullname,
      telephone: typed.telephone,
      email: typed.email,
      customerType: typed.customer_type,
      creditEligible: typed.credit_eligible,
      creditLimitPsw: Number(typed.credit_limit_psw),
      paymentTermsDays: typed.payment_terms_days,
      balancePsw: Number(typed.balance_psw),
      outstandingPsw: Number(typed.outstanding_psw),
      openItemsCount: Number(typed.open_items_count),
      oldestOpenChargeAt: typed.oldest_open_charge_at
        ? new Date(typed.oldest_open_charge_at)
        : null,
      overdueDays: Number(typed.overdue_days),
      approvalStatus: typed.approval_status,
    } satisfies CustomerWalletAccountRow;
  });

  const totalRecords = Number(
    (countRows[0] as { total_records?: string | number } | undefined)?.total_records ?? 0,
  );

  return { data, totalRecords };
}
