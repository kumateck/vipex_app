import { config } from 'dotenv';
import postgres from 'postgres';
config({ path: '.env', quiet: true });
config({ path: '.env.production', quiet: true });
const url =
  process.env.PRODUCTION_DATABASE_URL ||
  process.env.MIGRATE_DATABASE_URL ||
  process.env.DATABASE_URL;
if (!url) throw new Error('Production database URL missing');
const sql = postgres(url, { max: 1, connect_timeout: 15 });
try {
  await sql.begin('read only', async (tx) => {
    await tx.unsafe(`set local statement_timeout = '20s'`);
    console.log('Cleared-fee candidates by current state:');
    console.table(
      await tx.unsafe(`
      select p.status as parcel_status, d.status as delivery_status, count(*)::int as count,
        count(*) filter (where d.change_request_status = 'APPROVED' and d.requested_charge_psw > 0)::int as approved_fee_available,
        count(*) filter (where d.rider_collected_delivery_fee_psw > 0)::int as rider_collection_available
      from deliveries d join parcels p on p.id = d.parcel_id
      where d.charge_psw = 0 and d.returned_at is not null and d.mode = 1
        and not d.is_deleted and not p.is_deleted
      group by p.status, d.status order by p.status, d.status
    `),
    );
    const candidates = await tx.unsafe(`
      select p.id as parcel_id, p.booking_code, p.company_id, p.destination_id as branch_id,
        b.name as branch, p.status as parcel_status, d.id as delivery_id, d.status as delivery_status,
        d.charge_psw::int as current_fee_psw, d.updated_at, d.returned_at,
        coalesce((select sum(pay.gross_amount_psw) from payments pay where pay.parcel_id = p.id
          and pay.component = 1 and pay.voided_at is null), 0)::int as paid_fee_psw
      from deliveries d join parcels p on p.id = d.parcel_id
      left join branches b on b.id = p.destination_id
      where d.charge_psw = 0 and d.returned_at is not null and d.mode = 1
        and not d.is_deleted and not p.is_deleted
      order by p.status, p.booking_code, d.id
    `);
    const report = '/tmp/vipex-cleared-delivery-fees-2026-10-10.json';
    await Bun.write(
      report,
      JSON.stringify({ inspectedAt: new Date().toISOString(), candidates }, null, 2),
    );
    console.log(`Candidate report: ${report}`);
    console.log('Delivery audit evidence (metadata keys only):');
    console.table(
      await tx.unsafe(`
      select a.action, count(*)::int as count,
        (select string_agg(key, ', ' order by key) from jsonb_object_keys(a.metadata::jsonb) key) as metadata_keys
      from audit_logs a where a.entity_type = 'delivery'
      group by a.action, metadata_keys order by count desc limit 20
    `),
    );
    console.log('Return audit evidence (metadata keys only):');
    console.table(
      await tx.unsafe(`
      select a.action, count(*)::int as count,
        (select string_agg(key, ', ' order by key) from jsonb_object_keys(a.metadata::jsonb) key) as metadata_keys
      from audit_logs a where a.message like 'Rider returned parcel % to office'
      group by a.action, metadata_keys order by count desc limit 10
    `),
    );
  });
} finally {
  await sql.end();
}
