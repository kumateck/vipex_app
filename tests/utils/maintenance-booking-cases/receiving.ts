import { expect, test } from 'bun:test';
import { sql } from '@/db/config';
import { listParcelsRepo } from '@/server/features/shipments/parcels.repository';
import { executeMaintenanceRunSvc } from '@/server/features/maintenance/service';
import type { MaintenanceBookingFixture } from '../maintenance-booking-fixture';
import {
  applyReceiving,
  operationId,
  prepareReceivingCase,
  previewReceiving,
} from './receiving-fixture';

export function registerReceivingCases(fixture: () => MaintenanceBookingFixture) {
  test('missing location repair previews without writes and restores the location-scoped assignment search', async () => {
    const f = fixture();
    await prepareReceivingCase();
    const query = {
      companyId: 'company',
      destinationId: 'destination',
      locationId: 'circle',
      search: 'BOOK1',
      statuses: [3, 5],
      callCenterUncalledOnly: true,
      limit: 20,
      offset: 0,
    };
    expect((await listParcelsRepo(query)).totalRecords).toBe(0);
    const preview = await previewReceiving(f);
    expect(preview.result).toMatchObject({
      readyToApply: true,
      details: { changes: { pickupLocationId: 'circle' }, after: { status: 3 } },
    });
    expect((await sql`select pickup_location_id from parcels`)[0]!.pickup_location_id).toBeNull();
    await applyReceiving(f, preview.id);
    expect((await listParcelsRepo(query)).totalRecords).toBe(1);
    expect(
      (await sql`select status,received_at,call_center_called_at from parcels`)[0],
    ).toMatchObject({ status: 3, received_at: null, call_center_called_at: null });
    const [audit] = await sql`select actor_user_id,metadata from audit_logs
      where action = 'PARCEL_RECEIVING_WORKFLOW_REPAIRED'`;
    expect(audit).toMatchObject({
      actor_user_id: 'admin',
      metadata: {
        before: { pickupLocationId: null },
        after: { pickupLocationId: 'circle', status: 3 },
      },
    });
    expect((await previewReceiving(f)).result!.readyToApply).toBe(false);
    await expect(applyReceiving(f, preview.id)).rejects.toMatchObject({ status: 409 });
  });
  test('called arrival regression restores shelf search and preserves caller and call history', async () => {
    const f = fixture();
    await prepareReceivingCase(true);
    const query = {
      companyId: 'company',
      destinationId: 'destination',
      search: 'BOOK1',
      status: 5,
      shelfPickerAssignmentOrder: true,
      limit: 20,
      offset: 0,
    };
    expect((await listParcelsRepo(query)).totalRecords).toBe(0);
    const preview = await previewReceiving(f);
    expect(preview.result).toMatchObject({
      readyToApply: true,
      details: { changes: { status: 5 } },
    });
    await applyReceiving(f, preview.id);
    expect((await listParcelsRepo(query)).totalRecords).toBe(1);
    const [p] = await sql`select status,pickup_location_id,received_at,
      call_center_assigned_to_user_id,call_center_called_at from parcels`;
    expect(p).toMatchObject({
      status: 5,
      pickup_location_id: 'circle',
      received_at: null,
      call_center_assigned_to_user_id: 'admin',
    });
    expect(new Date(p!.call_center_called_at).getTime()).toBe(
      new Date('2026-10-21 07:17:34').getTime(),
    );
    expect((await previewReceiving(f)).result!.readyToApply).toBe(false);
  });
  test('both supported repairs can commit together', async () => {
    const f = fixture();
    await prepareReceivingCase(true);
    await sql`update parcels set pickup_location_id = null`;
    const preview = await previewReceiving(f);
    expect(preview.result!.details.changes).toEqual({ pickupLocationId: 'circle', status: 5 });
    await applyReceiving(f, preview.id);
    expect((await sql`select status,pickup_location_id from parcels`)[0]).toMatchObject({
      status: 5,
      pickup_location_id: 'circle',
    });
  });
  test('multiple locations block guessing and explicit choice is revalidated', async () => {
    const f = fixture();
    await prepareReceivingCase();
    await sql`insert into locations (id,company_id,branch_id,name,created_by)
      values ('second','company','destination','Second','admin'),
        ('foreign','other','destination','Private foreign location','admin'),
        ('source-location','company','source','Source','admin')`;
    const blocked = await previewReceiving(f);
    expect(blocked.result!.readyToApply).toBe(false);
    expect(blocked.result!.details.availableLocations).toHaveLength(2);
    expect(JSON.stringify(blocked.result)).not.toContain('Private foreign');
    for (const id of ['foreign', 'source-location'])
      expect((await previewReceiving(f, id)).result!.readyToApply).toBe(false);
    const explicit = await previewReceiving(f, 'second');
    expect(explicit.result!.readyToApply).toBe(true);
    await applyReceiving(f, explicit.id, 'second');
    expect((await sql`select pickup_location_id from parcels`)[0]!.pickup_location_id).toBe(
      'second',
    );
  });
  test('missing, foreign and ambiguous booking records and non-admin requests are rejected', async () => {
    const f = fixture();
    await prepareReceivingCase();
    await expect(
      executeMaintenanceRunSvc(
        { ...f.admin, sub: 'missing' },
        {
          operationId,
          params: { bookingCode: 'BOOK1' },
          mode: 'preview',
        },
      ),
    ).rejects.toMatchObject({ status: 403 });
    await expect(f.preview(operationId, 'missing')).rejects.toMatchObject({ status: 404 });
    await sql`update parcels set company_id = 'other'`;
    await expect(previewReceiving(f)).rejects.toMatchObject({ status: 404 });
    await sql`update parcels set company_id = 'company'`;
    await sql`insert into parcels (id,company_id,source_id,destination_id,booking_id,booking_code,
      tracking_code,sender_id,receiver_id,parcel_details,parcel_content)
      values ('duplicate','company','source','destination','booking','BOOK1','TRACK2','sender','receiver','Box','Clothes')`;
    await expect(previewReceiving(f)).rejects.toMatchObject({ status: 409 });
    expect((await f.preview(operationId, 'track1')).result!.readyToApply).toBe(true);
  });
}
