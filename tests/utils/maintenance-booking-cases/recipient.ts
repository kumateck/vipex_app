import { expect, test } from 'bun:test';
import { sql } from '@/db/config';
import type { MaintenanceBookingFixture } from '../maintenance-booking-fixture';

export function registerRecipientCases(fixture: () => MaintenanceBookingFixture) {
  const prepare = async () => {
    const f = fixture();
    await f.payment('sender-payment');
    await f.payment('recipient-payment', 1, 3000);
    await f.reversal();
    await sql.unsafe(
      `insert into tax_journal_items (id,company_id,branch_id,source_type,source_id,filing_status,tax_base_psw,tax_total_psw) values ('recipient-tax','company','source',7,'recipient-payment',0,3000,0)`,
    );
    return f;
  };
  test('recipient reversal repair voids only recipient principal and excludes unfiled tax atomically', async () => {
    const f = await prepare();
    const preview = await f.preview('fix-reversed-booking-to-be-paid');
    expect(preview.result!.readyToApply).toBe(true);
    await f.apply('fix-reversed-booking-to-be-paid', preview.id);
    expect(
      (await sql`select voided_by from payments where id = 'recipient-payment'`)[0]!.voided_by,
    ).toBe('admin');
    expect(
      (await sql`select voided_at from payments where id = 'sender-payment'`)[0]!.voided_at,
    ).toBeNull();
    expect(
      Number((await sql`select planned_tobepaid_psw from parcels`)[0]!.planned_tobepaid_psw),
    ).toBe(3000);
    expect((await sql`select filing_status from tax_journal_items`)[0]!.filing_status).toBe(3);
    expect((await f.preview('fix-reversed-booking-to-be-paid')).result!.readyToApply).toBe(false);
  });
  test('recipient collections require reversal evidence and cannot include fees or electronic money', async () => {
    const f = fixture();
    await f.payment('recipient-payment', 1, 3000);
    expect((await f.preview('fix-reversed-booking-to-be-paid')).result!.readyToApply).toBe(false);
    await f.reversal();
    await sql`update payments set method = 1`;
    expect((await f.preview('fix-reversed-booking-to-be-paid')).result!.readyToApply).toBe(false);
    await sql`update payments set method = 0, component = 1`;
    expect((await f.preview('fix-reversed-booking-to-be-paid')).result!.readyToApply).toBe(false);
  });
  test('filed tax and payments collected after the recorded reversal block execution', async () => {
    const f = await prepare();
    await sql`update tax_journal_items set filing_status = 1`;
    expect((await f.preview('fix-reversed-booking-to-be-paid')).result!.readyToApply).toBe(false);
    await sql`update tax_journal_items set filing_status = 0`;
    await sql`update payments set received_at = '2026-10-21' where payer = 1`;
    expect((await f.preview('fix-reversed-booking-to-be-paid')).result!.readyToApply).toBe(false);
  });
  test('saved cash confirmations block recipient payment voiding', async () => {
    const f = await prepare();
    await sql.unsafe(
      `insert into daily_cash_confirmations (id,company_id,branch_id,confirmation_date,expected_cash_psw,counted_cash_psw,created_by) values ('confirmation','company','source','2026-10-20',3000,3000,'admin')`,
    );
    expect((await f.preview('fix-reversed-booking-to-be-paid')).result!.readyToApply).toBe(false);
  });
}
