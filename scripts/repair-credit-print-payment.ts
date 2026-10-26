import { config } from 'dotenv';
import postgres from 'postgres';
import { createId } from '@paralleldrive/cuid2';

type TaggedTransaction = postgres.TransactionSql & {
  (
    template: TemplateStringsArray,
    ...values: postgres.ParameterOrFragment<never>[]
  ): postgres.PendingQuery<postgres.Row[]>;
};

config({ path: '.env', quiet: true });
const args = process.argv.slice(2);
const code = args[0]?.trim();
const value = (flag: string) => {
  const index = args.indexOf(flag);
  return index < 0 || args[index + 1]?.startsWith('--') ? undefined : args[index + 1];
};
const companyId = value('--company');
const paymentId = value('--payment-id');
const actorId = args.includes('--actor-user-id') ? value('--actor-user-id') : null;
const reason = args.includes('--reason') ? value('--reason')?.trim() : null;
const apply = args.includes('--apply');
const expectedPsw = Number(value('--expected-amount-psw'));
const marker = 'CREDIT_PRINT_PHANTOM_PAYMENT_REPAIR';
if (!code || !companyId || !paymentId || !Number.isSafeInteger(expectedPsw) || expectedPsw <= 0) {
  throw new Error(
    'Usage: bun run scripts/repair-credit-print-payment.ts <code> --company <id> --payment-id <id> --expected-amount-psw <integer> [--apply --actor-user-id <id> --reason <text> --confirm-no-cash-received]',
  );
}
if (
  apply &&
  (!actorId || !reason || reason.length < 10 || !args.includes('--confirm-no-cash-received'))
) {
  throw new Error('Apply requires an actor, an explanatory reason and --confirm-no-cash-received');
}
const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is required');
const sql = postgres(url, {
  max: 1,
  connect_timeout: 15,
  connection: {
    default_transaction_read_only: !apply,
    statement_timeout: 15000,
    lock_timeout: 3000,
  },
});

try {
  await sql.begin(
    apply ? 'isolation level serializable' : 'isolation level repeatable read read only',
    async (transaction) => {
      // postgres.js transactions are callable; its Omit-based type loses that signature.
      const tx = transaction as TaggedTransaction;
      const parcelRows = apply
        ? await tx`
      select * from parcels where company_id = ${companyId} and booking_code = ${code} for update
    `
        : await tx`select * from parcels where company_id = ${companyId} and booking_code = ${code}`;
      if (parcelRows.length !== 1) throw new Error('Expected exactly one company-scoped parcel');
      const parcel = parcelRows[0]!;
      if (
        parcel.method !== 4 ||
        parcel.is_deleted ||
        Number(parcel.charge_psw) !== expectedPsw ||
        Number(parcel.planned_tobepaid_psw) !== 0
      ) {
        throw new Error('Parcel no longer matches the reviewed full-credit case');
      }
      const paymentRows = apply
        ? await tx`
      select * from payments where parcel_id = ${parcel.id} and company_id = ${companyId} for update
    `
        : await tx`select * from payments where parcel_id = ${parcel.id} and company_id = ${companyId}`;
      const payment = paymentRows.find((row) => row.id === paymentId);
      if (
        !payment ||
        payment.component !== 0 ||
        payment.payer !== 0 ||
        payment.method !== 0 ||
        payment.momo_transaction_id ||
        Number(payment.gross_amount_psw) !== expectedPsw
      ) {
        throw new Error('Payment no longer matches the reviewed phantom cash principal');
      }
      if (payment.voided_at) {
        if (!String(payment.void_reason).startsWith(marker))
          throw new Error('Payment was voided by another operation');
        console.log(
          JSON.stringify({
            mode: apply ? 'apply' : 'dry-run',
            code,
            result: 'already repaired',
            paymentId,
          }),
        );
        return;
      }
      if (paymentRows.filter((row) => row.component === 0 && !row.voided_at).length !== 1) {
        throw new Error('Multiple active principal payments require manual reconciliation');
      }
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
      if (journals.length)
        throw new Error('Posted payment journals require Accounts reconciliation');
      const confirmations = await tx`
      select id from daily_cash_confirmations where company_id = ${companyId}
        and branch_id = ${payment.branch_id} and confirmation_date::date = ${payment.received_at}::timestamp::date
    `;
      if (confirmations.length)
        throw new Error('A saved daily cash confirmation exists; Accounts must reconcile it first');
      console.log(
        JSON.stringify(
          {
            mode: apply ? 'apply' : 'dry-run',
            code,
            parcelId: parcel.id,
            paymentId,
            voidAmountPsw: expectedPsw,
            excludeUnfiledTaxIds: taxes.map((row) => row.id),
            retainedCreditChargeId: charge.id,
            retainedCreditAmountPsw: expectedPsw,
          },
          null,
          2,
        ),
      );
      if (!apply) return;
      if (!actorId) throw new Error('Repair actor is required');
      const actors =
        await tx`select id from users where id = ${actorId} and company_id = ${companyId}`;
      if (actors.length !== 1) throw new Error('Repair actor must belong to the parcel company');
      const voidReason = `${marker}: ${reason}`;
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
      if (excluded.length !== taxes.length)
        throw new Error('Tax items changed while preparing repair');
      for (const item of excluded) {
        await tx`
        insert into tax_filing_audit_logs (id, tax_journal_item_id, action, old_status, new_status, reason, acted_by_user_id)
        values (${createId()}, ${item.id}, 'EXCLUDE', 0, 3, ${voidReason}, ${actorId})
      `;
      }
      await tx`
      insert into audit_logs (id, company_id, actor_user_id, entity_type, entity_id, action, message, metadata)
      values (${createId()}, ${companyId}, ${actorId}, 'payment', ${paymentId}, ${marker},
        ${voidReason}, ${tx.json({
          bookingCode: code,
          parcelId: parcel.id,
          paymentId,
          amountPsw: expectedPsw,
          retainedCreditChargeId: charge.id,
          taxItemIds: taxes.map((row) => row.id),
          beforePayment: payment,
          beforeTaxItems: taxes,
        })})
    `;
    },
  );
  if (apply)
    console.log(
      'Repair committed. Reprint the sticker and credit acknowledgement using the updated application.',
    );
} catch (error) {
  console.error('Repair aborted:', error instanceof Error ? error.message : 'Unknown error');
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 5 });
}
