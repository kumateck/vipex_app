import { createId } from '@paralleldrive/cuid2';
import { resolveRepairTarget, type TaggedTransaction } from './target';
import { REPAIR_MARKER, type RepairOptions } from './types';

export async function executeCreditPrintRepair(tx: TaggedTransaction, options: RepairOptions) {
  const { code, actorId, reason, apply } = options;
  const { parcel, payment, companyId, paymentId, expectedPsw, alreadyRepaired } =
    await resolveRepairTarget(tx, options);
  if (alreadyRepaired)
    return {
      status: 'already-repaired' as const,
      code,
      companyId,
      parcelId: parcel.id,
      paymentId,
      voidAmountPsw: expectedPsw,
    };
  const creditRows = apply
    ? await tx`
      select id, signed_amount_psw, source_type, transaction_type, customer_id from customer_credit_transactions
      where company_id = ${companyId} and reference_id = ${parcel.id} for update
    `
    : await tx`
      select id, signed_amount_psw, source_type, transaction_type, customer_id from customer_credit_transactions
      where company_id = ${companyId} and reference_id = ${parcel.id}
    `;
  const charge = creditRows[0];
  if (
    creditRows.length !== 1 ||
    !charge ||
    charge.source_type !== 0 ||
    charge.transaction_type !== 0 ||
    charge.customer_id !== parcel.sender_id ||
    Number(charge.signed_amount_psw) !== expectedPsw
  ) {
    throw new Error('Expected one unchanged sender credit charge covering the parcel');
  }
  const allocations =
    await tx`select id from customer_credit_allocations where charge_transaction_id = ${charge.id}`;
  if (allocations.length)
    throw new Error('Allocated credit repayments require manual reconciliation');
  const taxes = apply
    ? await tx`
      select * from tax_journal_items where company_id = ${companyId} and source_type = 7 and source_id = ${paymentId} for update
    `
    : await tx`select * from tax_journal_items where company_id = ${companyId} and source_type = 7 and source_id = ${paymentId}`;
  if (
    taxes.some((row) => row.filing_status !== 0 || row.journal_entry_id || row.filing_period_id)
  ) {
    throw new Error('Reviewed/filed/posted tax items require Accounts reconciliation');
  }
  const journals =
    await tx`select id from journal_entries where company_id = ${companyId} and source_type = 7 and source_id = ${paymentId}`;
  if (journals.length) throw new Error('Posted payment journals require Accounts reconciliation');
  const confirmations = await tx`
      select id from daily_cash_confirmations where company_id = ${companyId}
        and branch_id = ${payment.branch_id} and confirmation_date::date = ${payment.received_at}::timestamp::date
    `;
  if (confirmations.length)
    throw new Error('A saved daily cash confirmation exists; Accounts must reconcile it first');
  const report = {
    code,
    companyId,
    parcelId: String(parcel.id),
    paymentId,
    voidAmountPsw: expectedPsw,
    excludeUnfiledTaxIds: taxes.map((row) => String(row.id)),
    retainedCreditChargeId: String(charge.id),
    retainedCreditAmountPsw: expectedPsw,
  };
  if (!apply) return { ...report, status: 'ready' as const };
  if (actorId) {
    const actors =
      await tx`select id from users where id = ${actorId} and company_id = ${companyId}`;
    if (actors.length !== 1) throw new Error('Repair actor must belong to the parcel company');
  }
  const voidReason = `${REPAIR_MARKER}: ${reason}`;
  const updated = await tx`
      update payments set voided_at = now(), voided_by = ${actorId}, void_reason = ${voidReason}
      where id = ${paymentId} and company_id = ${companyId} and voided_at is null returning id
    `;
  if (updated.length !== 1) throw new Error('Payment changed while preparing repair');
  const excluded = await tx`
      update tax_journal_items set filing_status = 3, excluded_reason = ${voidReason},
        reviewed_by_user_id = ${actorId}, reviewed_at = now(), updated_at = now()
      where company_id = ${companyId} and source_type = 7 and source_id = ${paymentId}
        and filing_status = 0 and journal_entry_id is null and filing_period_id is null returning id
    `;
  if (excluded.length !== taxes.length) throw new Error('Tax items changed while preparing repair');
  for (const item of excluded) {
    await tx`
        insert into tax_filing_audit_logs (id, tax_journal_item_id, action, old_status, new_status, reason, acted_by_user_id)
        values (${createId()}, ${item.id}, 'EXCLUDE', 0, 3, ${voidReason}, ${actorId})
      `;
  }
  await tx`
      insert into audit_logs (id, company_id, actor_user_id, entity_type, entity_id, action, message, metadata)
      values (${createId()}, ${companyId}, ${actorId}, 'payment', ${paymentId}, ${REPAIR_MARKER},
        ${voidReason}, ${tx.typed(
          JSON.stringify({
            bookingCode: code,
            executionSource: options.executionSource ?? 'maintenance-cli',
            actorAttribution: actorId ? 'explicit-company-user' : 'system-maintenance',
            parcelId: parcel.id,
            paymentId,
            amountPsw: expectedPsw,
            retainedCreditChargeId: charge.id,
            taxItemIds: taxes.map((row) => row.id),
            beforePayment: payment,
            beforeTaxItems: taxes,
          }),
          25,
        )}::json)
    `;
  return { ...report, status: 'repaired' as const };
}
