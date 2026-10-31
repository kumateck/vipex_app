import { expect, test } from 'bun:test';
import { sql } from '@/db/config';
import { markIncomingParcelsArrivedSvc } from '@/server/features/shipments/parcel-bulk-receiving.service';
import type { ReceivingWorkflowFixture } from '../receiving-workflow-fixture';

const receive = (parcelIds = ['parcel']) =>
  markIncomingParcelsArrivedSvc({
    parcelIds,
    companyId: 'company',
    branchId: 'destination',
    actorUserId: 'admin',
  });
export function registerArrivalCases(fixture: () => ReceivingWorkflowFixture) {
  test('legacy status-only arrival records receiving actor/time and fills the sole location', async () => {
    const f = fixture();
    await f.location();
    const response = await f.request('PATCH', '/parcel', { status: 3 });
    expect(response.status).toBe(200);
    const [row] = await sql`select status,pickup_location_id,received_by,received_at from parcels`;
    expect(row).toMatchObject({ status: 3, pickup_location_id: 'circle', received_by: 'admin' });
    expect(row!.received_at).not.toBeNull();
  });
  test('receiving endpoint derives actor from authentication despite a forged receivedBy', async () => {
    const response = await fixture().request('POST', '/parcel/mark-received', {
      receivedBy: 'other-user',
      status: 3,
    });
    expect(response.status).toBe(200);
    expect((await sql`select received_by,status from parcels`)[0]).toMatchObject({
      received_by: 'admin',
      status: 3,
    });
  });
  test('called pickup and progressed parcels cannot be regressed even if received_at is missing', async () => {
    const f = fixture();
    for (const status of [3, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]) {
      await sql`update parcels set status = ${status},received_at = null,
        call_center_assigned_to_user_id = 'admin',call_center_called_at = '2026-10-21 07:17:34'`;
      for (const method of ['PATCH', 'POST']) {
        const response = await f.request(
          method,
          method === 'PATCH' ? '/parcel' : '/parcel/mark-received',
          { status: 3 },
        );
        expect(response.status).toBe(409);
      }
      expect(
        (await sql`select status,received_at,call_center_assigned_to_user_id from parcels`)[0],
      ).toMatchObject({ status, received_at: null, call_center_assigned_to_user_id: 'admin' });
    }
  });
  test('only one concurrent arrival succeeds and repeat arrival cannot overwrite its timestamp', async () => {
    const outcomes = await Promise.allSettled([receive(), receive()]);
    expect(outcomes.filter((outcome) => outcome.status === 'fulfilled')).toHaveLength(1);
    const [before] = await sql`select received_at from parcels`;
    await expect(receive()).rejects.toMatchObject({ status: 409 });
    expect((await sql`select received_at from parcels`)[0]).toEqual(before);
  });
  test('wrong company/branch, deleted and confirmed records are rejected without receipt writes', async () => {
    for (const changes of [
      "company_id = 'foreign'",
      "destination_id = 'source'",
      'is_deleted = true',
      'confirmed_at = now()',
    ]) {
      await sql`update parcels set company_id = 'company',destination_id = 'destination',is_deleted = false,confirmed_at = null`;
      await sql.unsafe(`update parcels set ${changes}`);
      await expect(receive()).rejects.toBeDefined();
      expect((await sql`select received_at from parcels`)[0]!.received_at).toBeNull();
    }
  });
  test('generic edit permission alone does not authorize arrival or mixed arrival edits', async () => {
    const f = fixture();
    expect(
      (await f.request('PATCH', '/parcel', { status: 3, parcelDetails: 'Changed' })).status,
    ).toBe(400);
    expect((await f.request('POST', '/parcel/mark-received', { status: 5 })).status).toBe(400);
    await sql`delete from role_permissions where permission <> 'CanUpdateParcels'`;
    expect((await f.request('PATCH', '/parcel', { status: 3 })).status).toBe(403);
    expect((await sql`select received_at from parcels`)[0]!.received_at).toBeNull();
  });
  test('bulk receiving rolls back the entire batch when one parcel is already awaiting pickup', async () => {
    await sql`insert into parcels (id,company_id,source_id,destination_id,booking_id,booking_code,
      tracking_code,sender_id,receiver_id,parcel_details,parcel_content,status)
      values ('second','company','source','destination','booking','BOOK2','TRACK2','sender','receiver','Box','Clothes',5)`;
    await expect(receive(['parcel', 'second'])).rejects.toMatchObject({ status: 409 });
    expect(
      (await sql`select received_at from parcels where id = 'parcel'`)[0]!.received_at,
    ).toBeNull();
  });
}
