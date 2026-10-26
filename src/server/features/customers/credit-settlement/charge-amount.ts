import { sql } from 'drizzle-orm';
import { CustomerCreditTransactionType } from '@/db/schemas/enums';

/** Call with the ledger's cct alias. Adjustments reference the original charge ID. */
export function effectiveChargeAmountSql() {
  return sql`(cct.signed_amount_psw + COALESCE((
    SELECT SUM(adj.signed_amount_psw) FROM customer_credit_transactions adj
    WHERE adj.company_id = cct.company_id AND adj.customer_id = cct.customer_id
      AND adj.transaction_type = ${CustomerCreditTransactionType.ADJUSTMENT}
      AND adj.reference_id = cct.id
  ), 0))`;
}
