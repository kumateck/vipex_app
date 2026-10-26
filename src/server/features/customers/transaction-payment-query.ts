import { sql } from 'drizzle-orm';
import { parcels } from '@/db/schemas';

/** Explicit outer identifiers preserve correlation inside Drizzle single-table projections. */
const parcelColumn = (key: 'id' | 'companyId' | 'senderId') =>
  sql`${parcels}.${sql.identifier(parcels[key].name)}`;
export const transactionPaidPrincipalSql =
  sql<number>`coalesce((select sum(pay.gross_amount_psw) from payments pay
  where pay.parcel_id = ${parcelColumn('id')} and pay.company_id = ${parcelColumn('companyId')}
    and pay.component = 0 and pay.voided_at is null and pay.method <> 4), 0)`.mapWith(Number);
export const transactionCreditPaidSql =
  sql<number>`coalesce((select sum(cca.amount_psw) from customer_credit_allocations cca
  join customer_credit_transactions cct on cct.id = cca.charge_transaction_id
    and cct.company_id = cca.company_id and cct.customer_id = cca.customer_id
  where cct.reference_id = ${parcelColumn('id')} and cct.company_id = ${parcelColumn('companyId')}
    and cct.customer_id = ${parcelColumn('senderId')} and cct.source_type = 0 and cct.transaction_type = 0), 0)`.mapWith(
    Number,
  );
