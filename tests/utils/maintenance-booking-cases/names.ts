import { expect, test } from 'bun:test';
import { sql } from '@/db/config';
import type { MaintenanceBookingFixture } from '../maintenance-booking-fixture';

export function registerNameCases(fixture: () => MaintenanceBookingFixture) {
  test('missing customer snapshots are filled and existing snapshots remain unchanged', async () => {
    const f = fixture();
    await sql`update parcels set sender_name_snapshot = 'Original sender', second_receiver_id = 'second'`;
    const preview = await f.preview('backfill-parcel-customer-names');
    expect(preview.result!.readyToApply).toBe(true);
    expect(
      (await sql`select receiver_name_snapshot from parcels`)[0]!.receiver_name_snapshot,
    ).toBeNull();
    await f.apply('backfill-parcel-customer-names', preview.id);
    expect(
      (
        await sql`select sender_name_snapshot, receiver_name_snapshot, second_receiver_name_snapshot from parcels`
      )[0],
    ).toMatchObject({
      sender_name_snapshot: 'Original sender',
      receiver_name_snapshot: 'Name receiver',
      second_receiver_name_snapshot: 'Name second',
    });
    expect((await f.preview('backfill-parcel-customer-names')).result!.readyToApply).toBe(false);
  });
  test('missing and foreign customer names block the backfill without leaking names', async () => {
    const f = fixture();
    await sql`update customers set company_id = 'other', fullname = 'Foreign secret' where id = 'receiver'`;
    const preview = await f.preview('backfill-parcel-customer-names');
    expect(preview.result!.readyToApply).toBe(false);
    expect(JSON.stringify(preview.result)).not.toContain('Foreign secret');
  });
  test('renaming a source customer invalidates an earlier backfill preview', async () => {
    const f = fixture();
    const preview = await f.preview('backfill-parcel-customer-names');
    await sql`update customers set fullname = 'Updated receiver' where id = 'receiver'`;
    await expect(f.apply('backfill-parcel-customer-names', preview.id)).rejects.toMatchObject({
      status: 409,
    });
  });
  test('business audit failure rolls back customer snapshot updates', async () => {
    const f = fixture();
    const preview = await f.preview('backfill-parcel-customer-names');
    await sql.unsafe(
      `create function reject_name_repair_audit() returns trigger language plpgsql as $$ begin if NEW.action = 'PARCEL_CUSTOMER_NAMES_BACKFILLED' then raise exception 'test audit failure'; end if; return NEW; end $$`,
    );
    await sql.unsafe(
      'create trigger reject_name_repair_audit before insert on audit_logs for each row execute function reject_name_repair_audit()',
    );
    try {
      await expect(f.apply('backfill-parcel-customer-names', preview.id)).rejects.toBeDefined();
    } finally {
      await sql.unsafe('drop trigger reject_name_repair_audit on audit_logs');
      await sql.unsafe('drop function reject_name_repair_audit()');
    }
    expect(
      (await sql`select receiver_name_snapshot from parcels`)[0]!.receiver_name_snapshot,
    ).toBeNull();
  });
  test('name backfill respects the installed snapshot trigger and retains existing names', async () => {
    const f = fixture();
    await sql`update parcels set sender_name_snapshot = 'Historical sender'`;
    const source = await Bun.file('drizzle/0081_parcel_receiver_name_corrections.sql').text();
    const start = source.indexOf('CREATE OR REPLACE FUNCTION');
    await sql.unsafe(source.slice(start, source.indexOf('$$;', start) + 3));
    await sql.unsafe(
      'create trigger test_name_snapshots before update on parcels for each row execute function set_parcel_customer_name_snapshots()',
    );
    try {
      const preview = await f.preview('backfill-parcel-customer-names');
      await f.apply('backfill-parcel-customer-names', preview.id);
      expect(
        (await sql`select sender_name_snapshot, receiver_name_snapshot from parcels`)[0],
      ).toMatchObject({
        sender_name_snapshot: 'Historical sender',
        receiver_name_snapshot: 'Name receiver',
      });
    } finally {
      await sql.unsafe('drop trigger test_name_snapshots on parcels');
      await sql.unsafe('drop function set_parcel_customer_name_snapshots()');
    }
  });
  test('existing empty snapshots are blocked instead of claiming a trigger-incompatible backfill', async () => {
    const f = fixture();
    await sql`update parcels set sender_name_snapshot = '   '`;
    expect((await f.preview('backfill-parcel-customer-names')).result!.readyToApply).toBe(false);
  });
}
