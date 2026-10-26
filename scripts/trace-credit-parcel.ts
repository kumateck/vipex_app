import { config } from 'dotenv';
import postgres from 'postgres';

type TaggedTransaction = postgres.TransactionSql & {
  (
    template: TemplateStringsArray,
    ...values: postgres.ParameterOrFragment<never>[]
  ): postgres.PendingQuery<postgres.Row[]>;
};

config({ path: '.env', quiet: true });
const code = process.argv[2]?.trim();
const scanCompany = code === '--scan-company' ? process.argv[3]?.trim() : null;
if (
  (!scanCompany && (!code || !/^[A-Za-z0-9-]{3,80}$/.test(code))) ||
  (scanCompany && !/^[a-zA-Z0-9]{1,25}$/.test(scanCompany))
) {
  throw new Error(
    'Usage: bun run scripts/trace-credit-parcel.ts <booking-or-tracking-code> | --scan-company <company-id>',
  );
}
const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is required');
const sql = postgres(url, {
  max: 1,
  connect_timeout: 15,
  connection: { default_transaction_read_only: true, statement_timeout: 15000 },
});

try {
  await sql.begin('isolation level repeatable read read only', async (transaction) => {
    // postgres.js transactions are callable; its Omit-based type loses that signature.
    const tx = transaction as TaggedTransaction;
    if (scanCompany) {
      const candidates = await tx`
        select p.id as parcel_id, p.booking_code, p.charge_psw, p.created_at,
          pay.id as payment_id, pay.gross_amount_psw, pay.received_at,
          count(*) over () as total_candidates
        from parcels p join payments pay on pay.parcel_id = p.id and pay.company_id = p.company_id
        where p.company_id = ${scanCompany} and p.method = 4 and not p.is_deleted
          and pay.component = 0 and pay.payer = 0 and pay.method = 0 and pay.voided_at is null
          and exists (select 1 from customer_credit_transactions c
            where c.company_id = p.company_id and c.customer_id = p.sender_id
              and c.reference_id = p.id and c.source_type = 0 and c.transaction_type = 0
              and c.signed_amount_psw > 0)
        order by p.created_at desc, p.id, pay.id limit 200
      `;
      console.log(
        JSON.stringify(
          {
            readOnly: true,
            companyId: scanCompany,
            warning: 'Candidates require confirmation that cash was not received before repair.',
            candidates,
          },
          null,
          2,
        ),
      );
      return;
    }
    if (!code) throw new Error('Booking or tracking code is required');
    const parcels = await tx`
      select id, company_id, booking_code, tracking_code, sender_id, method, status,
        charge_psw, planned_tobepaid_psw, is_deleted, created_at, updated_at
      from parcels where booking_code = ${code} or tracking_code = ${code} limit 11
    `;
    if (!parcels.length || parcels.length > 10) throw new Error('Expected 1–10 matching parcels');
    const reports = [];
    for (const parcel of parcels) {
      const payments = await tx`
        select id, company_id, branch_id, cashier_user_id, component, payer, method, gross_amount_psw, net_amount_psw,
          vat_psw, getfund_psw, nhil_psw, covid_psw, tax_total_psw, voided_at, received_at
        from payments where parcel_id = ${parcel.id} order by received_at, id limit 100
      `;
      const credit = await tx`
        select c.id, c.company_id, c.customer_id, c.source_type, c.transaction_type,
          c.signed_amount_psw, c.created_at,
          coalesce((select sum(a.amount_psw) from customer_credit_allocations a
            where a.charge_transaction_id = c.id and a.company_id = c.company_id
              and a.customer_id = c.customer_id), 0) as allocated_psw
        from customer_credit_transactions c where c.reference_id = ${parcel.id}
        order by c.created_at, c.id limit 100
      `;
      const audit = await tx`
        select entity_type, entity_id, action, created_at, metadata::jsonb ->> 'method' as recorded_method
        from audit_logs where company_id = ${parcel.company_id}
          and (entity_id = ${parcel.id} or entity_id in
            (select id from payments where parcel_id = ${parcel.id}))
        order by created_at desc limit 50
      `;
      const tax = await tx`
        select id, source_id, journal_entry_id, filing_status, filing_period_id,
          tax_base_psw, tax_total_psw from tax_journal_items
        where company_id = ${parcel.company_id} and source_type = 7
          and source_id in (select id from payments where parcel_id = ${parcel.id}) limit 100
      `;
      const journals = await tx`
        select id, source_type, source_id from journal_entries
        where company_id = ${parcel.company_id} and source_type = 7
          and source_id in (select id from payments where parcel_id = ${parcel.id}) limit 100
      `;
      reports.push({ parcel, payments, credit, audit, tax, journals });
    }
    console.log(
      JSON.stringify({ readOnly: true, inspectedAt: new Date().toISOString(), reports }, null, 2),
    );
  });
} catch (error) {
  console.error(
    'Read-only trace failed:',
    error instanceof Error ? error.message : 'Unknown error',
  );
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 5 });
}
