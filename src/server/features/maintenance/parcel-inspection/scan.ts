import type { TaggedTransaction } from '../credit-repair';
export async function scanCreditConflicts(
  tx: TaggedTransaction,
  scanCompany: string,
  bookingCode?: string,
) {
  const code = bookingCode ?? null;
  const candidates = await tx`
        select p.id as parcel_id, p.booking_code, p.charge_psw, p.created_at,
          pay.id as payment_id, pay.gross_amount_psw, pay.received_at,
          count(*) over () as total_candidates
        from parcels p join payments pay on pay.parcel_id = p.id and pay.company_id = p.company_id
        where p.company_id = ${scanCompany} and p.method = 4 and not p.is_deleted
          and (${code}::text is null or lower(p.booking_code) = lower(${code}) or lower(p.tracking_code) = lower(${code}))
          and pay.component = 0 and pay.payer = 0 and pay.method = 0 and pay.voided_at is null
          and exists (select 1 from customer_credit_transactions c
            where c.company_id = p.company_id and c.customer_id = p.sender_id
              and c.reference_id = p.id and c.source_type = 0 and c.transaction_type = 0
              and c.signed_amount_psw > 0)
        order by p.created_at desc, p.id, pay.id limit 200
      `;

  return { companyId: scanCompany, candidates };
}
