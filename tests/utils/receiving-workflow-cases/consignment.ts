import { expect, test } from 'bun:test';
import { sql } from '@/db/config';
import { receiveConsignmentItemSvc } from '@/server/features/shipments/consignment-receiving.service';
import type { ReceivingWorkflowFixture } from '../receiving-workflow-fixture';

const receive = () =>
  receiveConsignmentItemSvc({
    consignmentId: 'consignment',
    code: 'TRACK1',
    actorUserId: 'admin',
    actorBranchId: 'destination',
  });
export function registerConsignmentCases(fixture: () => ReceivingWorkflowFixture) {
  test('consignment receiving sets location and receipt and duplicate scans retain them', async () => {
    const f = fixture();
    await f.location();
    await f.consignment();
    expect((await receive()).outcome).toBe('RECEIVED');
    const [before] =
      await sql`select pickup_location_id,status,received_at,received_by from parcels`;
    expect(before).toMatchObject({ pickup_location_id: 'circle', status: 3, received_by: 'admin' });
    expect(before!.received_at).not.toBeNull();
    expect((await receive()).outcome).toBe('ALREADY_RECEIVED');
    expect(
      (await sql`select pickup_location_id,status,received_at,received_by from parcels`)[0],
    ).toEqual(before);
  });
  test('a stale unreceived consignment item cannot move a called pickup parcel backwards', async () => {
    await fixture().consignment();
    await sql`update parcels set status = 5,received_at = null,call_center_called_at = '2026-10-21 07:17:34'`;
    await expect(receive()).rejects.toMatchObject({ status: 409 });
    expect((await sql`select arrived_at from consignment_items`)[0]!.arrived_at).toBeNull();
    expect((await sql`select status,received_at from parcels`)[0]).toMatchObject({
      status: 5,
      received_at: null,
    });
  });
  test('ambiguous pickup locations roll back item and parcel receiving together', async () => {
    const f = fixture();
    await f.location();
    await f.location('second');
    await f.consignment();
    await expect(receive()).rejects.toThrow('Select a pickup location');
    expect((await sql`select arrived_at from consignment_items`)[0]!.arrived_at).toBeNull();
    expect((await sql`select received_at from parcels`)[0]!.received_at).toBeNull();
  });
}
