import { expect, test } from 'bun:test';
import { db, sql } from '@/db/config';
import { createBookingWithParcelsSvc } from '@/server/features/shipments/booking-with-parcels.service';
import { createParcelSvc, updateParcelSvc } from '@/server/features/shipments/parcels.service';
import { resolveReceivingPickupLocationsRepo } from '@/server/features/locations';
import type { ReceivingWorkflowFixture } from '../receiving-workflow-fixture';

const booking = (pickupLocationId?: string) =>
  createBookingWithParcelsSvc({
    senderId: 'sender',
    companyId: 'company',
    sourceId: 'source',
    status: 0,
    createdBy: 'admin',
    parcels: [
      {
        destinationId: 'destination',
        pickupLocationId,
        receiverId: 'receiver',
        status: 0,
        parcelDetails: 'Box',
        parcelContent: 'Clothes',
        chargeCedis: 50,
        plannedToBePaidCedis: 50,
        method: 0,
        cashierUserId: 'admin',
        branchId: 'source',
      },
    ],
  });
export function registerLocationCases(fixture: () => ReceivingWorkflowFixture) {
  test('older booking clients omitting location receive the sole receiving location', async () => {
    await fixture().location();
    const result = await booking();
    expect(
      (await sql`select pickup_location_id from parcels where id = ${result.parcels[0]!.id}`)[0]!
        .pickup_location_id,
    ).toBe('circle');
  });
  test('ambiguous destination locations block booking before headers/payments are inserted', async () => {
    const f = fixture();
    await f.location();
    await f.location('second');
    await expect(booking()).rejects.toThrow('Select a pickup location');
    expect(await sql`select id from bookings`).toHaveLength(0);
    expect(await sql`select id from payments`).toHaveLength(0);
    const result = await booking('second');
    expect(
      (await sql`select pickup_location_id from parcels where id = ${result.parcels[0]!.id}`)[0]!
        .pickup_location_id,
    ).toBe('second');
  });
  test('foreign, source-branch, deleted and sending-only pickup locations are rejected', async () => {
    const f = fixture();
    await f.location();
    await f.location('foreign', 'destination', 'other');
    await f.location('source-loc', 'source');
    for (const id of ['foreign', 'source-loc'])
      await expect(booking(id)).rejects.toThrow('valid destination');
    await sql`update locations set can_receive = false where id = 'circle'`;
    await expect(booking('circle')).rejects.toThrow('does not receive');
    await expect(booking()).rejects.toThrow('no receiving-enabled');
    await sql`update locations set can_receive = true,is_deleted = true where id = 'circle'`;
    await expect(booking('circle')).rejects.toThrow('valid destination');
  });
  test('branch-only destinations remain supported and sending-only locations are never defaulted', async () => {
    const result = await db.transaction((tx) =>
      resolveReceivingPickupLocationsRepo('company', [{ destinationId: 'destination' }], tx),
    );
    expect(result[0]!.pickupLocationId).toBeNull();
    await fixture().location();
    await fixture().location('sending');
    await sql`update locations set can_receive = false where id = 'sending'`;
    expect((await booking()).parcels).toHaveLength(1);
  });
  test('standalone creation and location-clearing edits use the same location resolution', async () => {
    await fixture().location();
    const created = await createParcelSvc({
      companyId: 'company',
      sourceId: 'source',
      destinationId: 'destination',
      bookingId: 'booking',
      bookingCode: 'BOOK2',
      trackingCode: 'TRACK2',
      senderId: 'sender',
      receiverId: 'receiver',
      status: 0,
      parcelDetails: 'Box',
      parcelContent: 'Clothes',
      method: 0,
      chargeCedis: 50,
    });
    expect(
      (await sql`select pickup_location_id from parcels where id = ${created.id}`)[0]!
        .pickup_location_id,
    ).toBe('circle');
    await updateParcelSvc('parcel', { pickupLocationId: null }, 'admin');
    expect(
      (await sql`select pickup_location_id from parcels where id = 'parcel'`)[0]!
        .pickup_location_id,
    ).toBe('circle');
  });
}
