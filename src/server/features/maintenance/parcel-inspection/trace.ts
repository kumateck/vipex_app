import type { TaggedTransaction } from '../credit-repair';
export async function traceCreditParcel(tx: TaggedTransaction, code: string, companyId?: string) {
  const scope = companyId ?? null;
  const parcels = await tx`
      select id, company_id, booking_code, tracking_code, sender_id, method, status,
        charge_psw, planned_tobepaid_psw, is_deleted, created_at, updated_at
      from parcels where (booking_code = ${code} or tracking_code = ${code})
        and (${scope}::text is null or company_id = ${scope}) limit 11
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
        from customer_credit_transactions c where c.reference_id = ${parcel.id} and c.company_id = ${parcel.company_id}
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

  return { readOnly: true, inspectedAt: new Date().toISOString(), reports };
}
