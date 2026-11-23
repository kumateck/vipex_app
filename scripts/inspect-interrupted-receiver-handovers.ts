import { config } from 'dotenv';
import postgres from 'postgres';
import type { TaggedTransaction } from '../src/server/features/maintenance/credit-repair';
import { recoverUnpaidReceiverHandover } from '../src/server/features/maintenance/booking-operations';

config({ path: '.env', quiet: true });
const url = process.env.CHECK_DATABASE_URL || process.env.DATABASE_URL;
if (!url) throw new Error('CHECK_DATABASE_URL or DATABASE_URL is required');
const client = postgres(url, {
  max: 1,
  connect_timeout: 10,
  connection: {
    default_transaction_read_only: true,
    statement_timeout: 20000,
    jit: 'off',
    max_parallel_workers_per_gather: '0',
  },
});

try {
  const report = await client.begin('read only', async (transaction) => {
    const tx = transaction as TaggedTransaction;
    const [identity] = await tx`
      select current_database() as database,
        current_setting('transaction_read_only') as read_only, now() as inspected_at
    `;
    if (identity?.read_only !== 'on') throw new Error('Read-only transaction required');
    const pending = await tx`
      select p.id, p.company_id, p.booking_code, b.name as branch, p.status, p.confirmed_at,
        p.planned_tobepaid_psw, p.pending_receiver_handover->>'requestedAt' as requested_at,
        u.fullname as requested_by,
        p.pending_receiver_handover ? 'paymentPlan' as has_deferred_payment_plan,
        p.pending_receiver_handover ? 'capture' as signed,
        p.pending_receiver_handover->>'otpVerified' as otp_verified,
        p.pending_receiver_handover->'snapshot'->>'pickupQueueId' as original_ticket_id,
        q.queue_date as ticket_date, q.ended_at as ticket_ended_at,
        coalesce(pay.amount_psw, 0)::text as recipient_paid_psw,
        pay.payment_count, pay.first_payment_at, pay.last_payment_at,
        pay.cashiers
      from parcels p
      join branches b on b.id = p.destination_id
      left join users u on u.id = p.pending_receiver_handover->>'requestedBy'
      left join pickup_queues q
        on q.id = p.pending_receiver_handover->'snapshot'->>'pickupQueueId'
      left join lateral (
        select sum(pm.gross_amount_psw) as amount_psw, count(*)::int as payment_count,
          min(pm.received_at) as first_payment_at, max(pm.received_at) as last_payment_at,
          string_agg(distinct cashier.fullname, ', ') as cashiers
        from payments pm join users cashier on cashier.id = pm.cashier_user_id
        where pm.parcel_id = p.id and pm.voided_at is null
          and pm.payer = 1 and pm.cashier_type = 1
      ) pay on true
      where p.pending_receiver_handover is not null and not p.is_deleted
      order by p.pending_receiver_handover->>'requestedAt' desc
      limit 100
    `;
    const paidUndelivered = await tx`
      select b.name as branch, p.status,
        (p.pending_receiver_handover is not null) as has_pending_handover,
        count(distinct p.id)::int as parcels, count(*)::int as payments,
        sum(pm.gross_amount_psw)::text as recipient_paid_psw,
        min(pm.received_at) as first_payment_at, max(pm.received_at) as last_payment_at
      from payments pm join parcels p on p.id = pm.parcel_id
      join branches b on b.id = p.destination_id
      where pm.voided_at is null and pm.payer = 1 and pm.cashier_type = 1
        and not p.is_deleted and p.confirmed_at is null and p.status = 5
      group by b.name, p.status, (p.pending_receiver_handover is not null)
      order by parcels desc
    `;
    const examples = await tx`
      select p.booking_code, b.name as branch, p.status, p.planned_tobepaid_psw,
        (p.pending_receiver_handover is not null) as has_pending_handover,
        pm.gross_amount_psw, pm.component, pm.received_at, u.fullname as cashier,
        (p.delivery_confirmation_snapshot is not null) as has_delivery_snapshot,
        (select jsonb_agg(event) from (
          select a.action, a.created_at, a.message,
            a.metadata->'patch'->>'status' as next_status
          from audit_logs a where a.entity_id = p.id
          order by a.created_at desc limit 4
        ) event) as recent_history
      from payments pm join parcels p on p.id = pm.parcel_id
      join branches b on b.id = p.destination_id
      join users u on u.id = pm.cashier_user_id
      where pm.voided_at is null and pm.payer = 1 and pm.cashier_type = 1
        and not p.is_deleted and p.confirmed_at is null and p.status = 5
      order by pm.received_at desc limit 100
    `;
    const pendingSummary = pending.reduce<
      Record<string, { count: number; signed: number; paidPsw: number }>
    >((summary, row) => {
      const key = `${row.branch}: ${row.has_deferred_payment_plan ? 'deferred' : 'legacy paid'}`;
      const group = (summary[key] ??= { count: 0, signed: 0, paidPsw: 0 });
      group.count++;
      group.signed += Number(row.signed);
      group.paidPsw += Number(row.recipient_paid_psw);
      return summary;
    }, {});
    const unpaidRecoveryPlans = [];
    if (process.argv.includes('--recovery-preview')) {
      for (const row of pending.filter((item) => !item.has_deferred_payment_plan)) {
        unpaidRecoveryPlans.push(
          await recoverUnpaidReceiverHandover(tx, {
            companyId: String(row.company_id),
            code: String(row.booking_code),
            actorId: '',
            apply: false,
          }),
        );
      }
    }
    return { identity, pendingSummary, pending, paidUndelivered, examples, unpaidRecoveryPlans };
  });
  console.log(JSON.stringify(report, null, 2));
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Inspection failed');
  process.exitCode = 1;
} finally {
  await client.end();
}
