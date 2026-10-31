import { expect, test } from 'bun:test';
import { sql } from '@/db/config';
import type { MaintenanceBookingFixture } from '../maintenance-booking-fixture';
import { applyReceiving, prepareReceivingCase, previewReceiving } from './receiving-fixture';

export function registerReceivingGuardCases(fixture: () => MaintenanceBookingFixture) {
  test('missing regression evidence and regressions before the call block status restoration', async () => {
    await prepareReceivingCase(true);
    await sql`delete from audit_logs where id = 'arrival'`;
    expect((await previewReceiving(fixture())).result!.readyToApply).toBe(false);
    await sql`insert into audit_logs (id,company_id,entity_type,entity_id,action,metadata,created_at)
      values ('old','company','parcel','parcel','PARCEL_UPDATED',
      '{"patch":{"status":3},"previous":{"status":5}}'::json,'2026-10-20')`;
    expect((await previewReceiving(fixture())).result!.readyToApply).toBe(false);
  });
  test('deleted, confirmed and completed home-delivery records are blocked', async () => {
    await prepareReceivingCase();
    await sql`update parcels set deleted_at = now()`;
    expect((await previewReceiving(fixture())).result!.readyToApply).toBe(false);
    await sql`update parcels set deleted_at = null,confirmed_at = now()`;
    expect((await previewReceiving(fixture())).result!.readyToApply).toBe(false);
    await sql`update parcels set confirmed_at = null`;
    await sql`insert into deliveries (id,parcel_id,mode,status,created_by)
      values ('delivery','parcel',1,'QUEUED','admin')`;
    expect((await previewReceiving(fixture())).result!.readyToApply).toBe(false);
    await sql`update deliveries set mode = 0,status = 'DELIVERED' where id = 'delivery'`;
    expect((await previewReceiving(fixture())).result!.readyToApply).toBe(false);
  });
  test('changed caller, call marker or available receiving location invalidates preview', async () => {
    const f = fixture();
    await prepareReceivingCase(true);
    let preview = await previewReceiving(f);
    await sql`update parcels set call_center_assigned_to_user_id = null`;
    await expect(applyReceiving(f, preview.id)).rejects.toMatchObject({ status: 409 });
    preview = await previewReceiving(f);
    await sql`update parcels set call_center_called_at = '2026-10-21 07:18:34'`;
    await expect(applyReceiving(f, preview.id)).rejects.toMatchObject({ status: 409 });
    preview = await previewReceiving(f);
    await sql`update locations set can_receive = false where id = 'circle'`;
    await expect(applyReceiving(f, preview.id)).rejects.toMatchObject({ status: 409 });
    expect((await sql`select status from parcels`)[0]!.status).toBe(3);
  });
  test('inactive/deleted receiving locations and overwriting an existing location are refused', async () => {
    const f = fixture();
    await prepareReceivingCase();
    await sql`update locations set can_receive = false`;
    expect((await previewReceiving(f)).result!.readyToApply).toBe(false);
    await sql`update locations set can_receive = true,is_deleted = true`;
    expect((await previewReceiving(f)).result!.readyToApply).toBe(false);
    await sql`update locations set is_deleted = false`;
    await sql`update parcels set pickup_location_id = 'existing'`;
    expect((await previewReceiving(f, 'circle')).result!.readyToApply).toBe(false);
  });
  test('business audit failure rolls back the location change', async () => {
    const f = fixture();
    await prepareReceivingCase();
    const preview = await previewReceiving(f);
    await sql.unsafe(`alter table audit_logs add constraint block_receiving_repair_audit
      check (action <> 'PARCEL_RECEIVING_WORKFLOW_REPAIRED') not valid`);
    try {
      await expect(applyReceiving(f, preview.id)).rejects.toBeDefined();
      expect((await sql`select pickup_location_id from parcels`)[0]!.pickup_location_id).toBeNull();
    } finally {
      await sql.unsafe('alter table audit_logs drop constraint block_receiving_repair_audit');
    }
    await applyReceiving(f, preview.id);
    expect((await sql`select pickup_location_id from parcels`)[0]!.pickup_location_id).toBe(
      'circle',
    );
  });
}
