import { createId } from '@paralleldrive/cuid2';
import type { TaggedTransaction } from '../credit-repair';

export async function inspectPaymentVoid(
  tx: TaggedTransaction,
  companyId: string,
  paymentIds: string[],
  apply: boolean,
) {
  if (!paymentIds.length) return { taxes: [], journals: [], confirmations: [], restriction: null };
  const taxes = await tx.unsafe(
    `select * from tax_journal_items where company_id = $1
    and source_type = 7 and source_id = any($2::text[]) order by id${apply ? ' for update' : ''}`,
    [companyId, paymentIds],
  );
  const journals =
    await tx`select id, source_id from journal_entries where company_id = ${companyId}
    and source_type = 7 and source_id = any(${paymentIds}::text[]) order by id`;
  const confirmations =
    await tx`select distinct c.id from daily_cash_confirmations c join payments pay
    on pay.company_id = c.company_id and pay.branch_id = c.branch_id and pay.received_at::date = c.confirmation_date::date
    where pay.company_id = ${companyId} and pay.id = any(${paymentIds}::text[]) order by c.id`;
  const restriction =
    taxes.some((row) => row.filing_status !== 0 || row.journal_entry_id || row.filing_period_id) ||
    journals.length ||
    confirmations.length
      ? 'Reviewed/filed tax, posted journals or saved cash confirmations require Accounts reconciliation.'
      : null;
  return { taxes, journals, confirmations, restriction };
}
export async function excludeVoidedPaymentTax(
  tx: TaggedTransaction,
  companyId: string,
  actorId: string,
  paymentIds: string[],
  reason: string,
) {
  const taxes =
    await tx`update tax_journal_items set filing_status = 3, excluded_reason = ${reason},
    reviewed_by_user_id = ${actorId}, reviewed_at = now(), updated_at = now()
    where company_id = ${companyId} and source_type = 7 and source_id = any(${paymentIds}::text[])
      and filing_status = 0 and journal_entry_id is null and filing_period_id is null returning id`;
  for (const tax of taxes) {
    await tx`insert into tax_filing_audit_logs (id, tax_journal_item_id, action, old_status, new_status, reason, acted_by_user_id)
      values (${createId()}, ${tax.id}, 'EXCLUDE', 0, 3, ${reason}, ${actorId})`;
  }
  return taxes.length;
}
