import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'bun:test';
import postgres from 'postgres';

const url = process.env.CREDIT_PRINT_REPAIR_TEST_DATABASE_URL;
if (url) {
  const target = new URL(url);
  if (target.hostname !== '127.0.0.1' || target.pathname !== '/vipex_credit_print_repair_test') {
    throw new Error(
      'Repair tests require the dedicated local vipex_credit_print_repair_test database',
    );
  }
}

describe.skipIf(!url)('credit printing repair script on isolated PostgreSQL', () => {
  let sql: ReturnType<typeof postgres>;
  const run = async (apply = false, extra: string[] = []) => {
    const process = Bun.spawn(
      [
        'bun',
        'run',
        'scripts/repair-credit-print-payment.ts',
        'AO4858124I',
        '--company',
        'test-company',
        '--payment-id',
        'test-payment',
        '--expected-amount-psw',
        '5000',
        ...(apply
          ? [
              '--apply',
              '--actor-user-id',
              'test-actor',
              '--reason',
              'Confirmed printing created cash row; no cash received',
              '--confirm-no-cash-received',
            ]
          : []),
        ...extra,
      ],
      {
        cwd: import.meta.dir + '/../..',
        env: { ...globalThis.process.env, DATABASE_URL: url!, NODE_ENV: 'test' },
        stdout: 'pipe',
        stderr: 'pipe',
      },
    );
    const [stdout, stderr, code] = await Promise.all([
      new Response(process.stdout).text(),
      new Response(process.stderr).text(),
      process.exited,
    ]);
    return { code, stdout, stderr };
  };
  const state = async () => ({
    payment: (await sql`select * from payments`)[0]!,
    tax: (await sql`select * from tax_journal_items`)[0]!,
    credit: (await sql`select * from customer_credit_transactions`)[0]!,
    parcel: (await sql`select * from parcels`)[0]!,
    audit: await sql`select * from audit_logs`,
    taxAudit: await sql`select * from tax_filing_audit_logs`,
  });
  beforeAll(async () => {
    sql = postgres(url!, { max: 1 });
    await sql.unsafe(`
      create table if not exists parcels (id text primary key, company_id text, booking_code text,
        sender_id text, method smallint, is_deleted boolean, charge_psw bigint, planned_tobepaid_psw bigint, status smallint);
      create table if not exists payments (id text primary key, parcel_id text, company_id text, branch_id text,
        component smallint, payer smallint, method smallint, momo_transaction_id text, gross_amount_psw bigint,
        received_at timestamp, voided_at timestamp, voided_by text, void_reason text);
      create table if not exists customer_credit_transactions (id text primary key, company_id text, reference_id text,
        customer_id text, source_type smallint, transaction_type smallint, signed_amount_psw bigint);
      create table if not exists customer_credit_allocations (id text primary key, charge_transaction_id text);
      create table if not exists tax_journal_items (id text primary key, company_id text, source_type smallint,
        source_id text, filing_status smallint, journal_entry_id text, filing_period_id text, excluded_reason text,
        reviewed_by_user_id text, reviewed_at timestamp, updated_at timestamp);
      create table if not exists journal_entries (id text primary key, company_id text, source_type smallint, source_id text);
      create table if not exists daily_cash_confirmations (id text primary key, company_id text, branch_id text, confirmation_date timestamp);
      create table if not exists users (id text primary key, company_id text);
      create table if not exists audit_logs (id text primary key, company_id text, actor_user_id text,
        entity_type text, entity_id text, action text, message text, metadata jsonb);
      create table if not exists tax_filing_audit_logs (id text primary key, tax_journal_item_id text,
        action text, old_status smallint, new_status smallint, reason text, acted_by_user_id text);
    `);
  });
  beforeEach(async () => {
    await sql.unsafe(`
      truncate parcels, payments, customer_credit_transactions, customer_credit_allocations, tax_journal_items,
        journal_entries, daily_cash_confirmations, users, audit_logs, tax_filing_audit_logs;
      insert into parcels values ('test-parcel','test-company','AO4858124I','test-sender',4,false,5000,0,5);
      insert into payments (id,parcel_id,company_id,branch_id,component,payer,method,gross_amount_psw,received_at)
        values ('test-payment','test-parcel','test-company','test-branch',0,0,0,5000,'2026-10-24 19:00:40');
      insert into customer_credit_transactions values ('test-credit','test-company','test-parcel','test-sender',0,0,5000);
      insert into tax_journal_items (id,company_id,source_type,source_id,filing_status)
        values ('test-tax','test-company',7,'test-payment',0);
      insert into users values ('test-actor','test-company');
    `);
  });
  afterAll(async () => {
    await sql?.end({ timeout: 5 });
  });

  test('dry-run cannot change payment, tax, credit, parcel or audit', async () => {
    const before = await state();
    const result = await run();
    expect(result.code).toBe(0);
    expect(await state()).toEqual(before);
  });
  test('repair is atomic, preserves credit/transit and is idempotent', async () => {
    const result = await run(true);
    expect(result.code).toBe(0);
    const after = await state();
    expect(after.payment.voided_at).not.toBeNull();
    expect(after.payment.voided_by).toBe('test-actor');
    expect(after.tax.filing_status).toBe(3);
    expect(Number(after.credit.signed_amount_psw)).toBe(5000);
    expect(after.parcel.status).toBe(5);
    expect(after.parcel.planned_tobepaid_psw).toBe('0');
    expect(after.audit).toHaveLength(1);
    expect(after.taxAudit).toHaveLength(1);
    expect(after.taxAudit[0]!.action).toBe('EXCLUDE');
    expect(after.audit[0]!.metadata.beforePayment.voided_at).toBeNull();
    const repeated = await run(true);
    expect(repeated.code).toBe(0);
    expect(await state()).toEqual(after);
  });
  test.each([
    ['filed tax', `update tax_journal_items set filing_status = 2`],
    [
      'posted journal',
      `insert into journal_entries values ('posted','test-company',7,'test-payment')`,
    ],
    [
      'allocated credit',
      `insert into customer_credit_allocations values ('allocated','test-credit')`,
    ],
    [
      'daily cash confirmation',
      `insert into daily_cash_confirmations values ('confirmed','test-company','test-branch','2026-10-24')`,
    ],
    ['changed amount', `update payments set gross_amount_psw = 4000`],
    ['wrong-company actor', `update users set company_id = 'another-company'`],
  ])('refuses %s and leaves all rows unchanged', async (_name, change) => {
    await sql.unsafe(change);
    const before = await state();
    expect((await run(true)).code).toBe(1);
    expect(await state()).toEqual(before);
  });
  test('audit failure rolls back both payment void and tax exclusion', async () => {
    await sql.unsafe(
      `alter table audit_logs add constraint reject_repair check (action <> 'CREDIT_PRINT_PHANTOM_PAYMENT_REPAIR')`,
    );
    try {
      const before = await state();
      expect((await run(true)).code).toBe(1);
      expect(await state()).toEqual(before);
    } finally {
      await sql.unsafe('alter table audit_logs drop constraint reject_repair');
    }
  });
});
