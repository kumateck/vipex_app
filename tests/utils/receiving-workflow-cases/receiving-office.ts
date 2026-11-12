import { expect, test } from 'bun:test';
import { db, sql } from '@/db/config';
import { ParcelStatus, receivingOffices } from '@/db/schemas';
import { receiveConsignmentItemSvc } from '@/server/features/shipments/consignment-receiving.service';
import type { ReceivingWorkflowFixture } from '../receiving-workflow-fixture';

async function addOffices(locationId: string, ...officeIds: string[]) {
  await db
    .insert(receivingOffices)
    .values(officeIds.map((id, index) => ({ id, locationId, name: `Office ${index + 1}` })));
}

export function registerReceivingOfficeCases(fixture: () => ReceivingWorkflowFixture) {
  test('single-office receiving assigns the only office automatically', async () => {
    const f = fixture();
    await f.location();
    await addOffices('circle', 'office1');

    expect((await f.request('POST', '/parcel/mark-received', {})).status).toBe(200);
    expect((await sql`select pickup_location_id, receiving_office_id from parcels`)[0]).toEqual({
      pickup_location_id: 'circle',
      receiving_office_id: 'office1',
    });
  });

  test('rejects missing or foreign office for multi-office receiving without partial writes', async () => {
    const f = fixture();
    await f.location('anloga');
    await f.location('foreign-location', 'destination', 'foreign');
    await addOffices('anloga', 'office1', 'office2', 'office3', 'office4');
    await addOffices('foreign-location', 'foreign-office');

    for (const receivingOfficeId of [undefined, 'foreign-office']) {
      expect(
        (
          await f.request('POST', '/bulk-mark-received', {
            parcelIds: ['parcel'],
            receivingOfficeId,
          })
        ).status,
      ).toBe(400);
    }
    expect((await sql`select status, received_at, receiving_office_id from parcels`)[0]).toEqual({
      status: ParcelStatus.IN_TRANSIT,
      received_at: null,
      receiving_office_id: null,
    });

    expect(
      (
        await f.request('POST', '/bulk-mark-received', {
          parcelIds: ['parcel'],
          receivingOfficeId: 'office3',
        })
      ).status,
    ).toBe(200);
    expect((await sql`select receiving_office_id from parcels`)[0]?.receiving_office_id).toBe(
      'office3',
    );
  });

  test('office changes appear in parcel search and details and cannot move a handed-over parcel', async () => {
    const f = fixture();
    await f.location('anloga');
    await addOffices('anloga', 'office1', 'office2');
    await sql`update parcels set status = ${ParcelStatus.AWAITING_PICKUP},
      pickup_location_id = 'anloga', receiving_office_id = 'office1', received_at = now()`;
    const receiveAt = (await sql`select received_at from parcels`)[0]?.received_at;

    const assigned = await f.request('PATCH', '/parcel/receiving-office', {
      receivingOfficeId: 'office2',
    });
    expect(assigned.status).toBe(200);
    expect(await assigned.json()).toEqual({
      receivingOfficeId: 'office2',
      receivingOfficeName: 'Office 2',
    });

    const search = await f.request('GET', '/?search=BOOK1');
    expect(search.status).toBe(200);
    expect(await search.json()).toMatchObject({
      data: [
        {
          pickupLocationName: 'anloga',
          receivingOfficeId: 'office2',
          receivingOfficeName: 'Office 2',
        },
      ],
    });
    const detail = await f.request('GET', '/parcel/details');
    expect(detail.status).toBe(200);
    expect(await detail.json()).toMatchObject({
      parcel: { receivingOfficeName: 'Office 2' },
      summary: { pickupLocationName: 'anloga', receivingOfficeName: 'Office 2' },
    });
    expect((await sql`select received_at from parcels`)[0]?.received_at).toEqual(receiveAt);

    await sql`update users set branch_id = 'source' where id = 'admin'`;
    const wrongBranch = await f.request('PATCH', '/parcel/receiving-office', {
      receivingOfficeId: 'office1',
    });
    expect(wrongBranch.status).toBe(404);
    await sql`update users set branch_id = 'destination' where id = 'admin'`;

    await sql`update parcels set status = ${ParcelStatus.DELIVERED_BY_OFFICE}`;
    expect(
      (await f.request('PATCH', '/parcel/receiving-office', { receivingOfficeId: 'office1' }))
        .status,
    ).toBe(409);
    const delivered = await f.request('GET', '/?search=BOOK1');
    expect(await delivered.json()).toMatchObject({ data: [{ receivingOfficeName: null }] });
  });

  test('consignment receiving rolls back the checklist until an office is selected', async () => {
    const f = fixture();
    await f.location('anloga');
    await addOffices('anloga', 'office1', 'office2');
    await f.consignment();
    const input = {
      consignmentId: 'consignment',
      code: 'TRACK1',
      actorUserId: 'admin',
      actorBranchId: 'destination',
    };
    await expect(receiveConsignmentItemSvc(input)).rejects.toMatchObject({ status: 400 });
    expect((await sql`select arrived_at from consignment_items`)[0]?.arrived_at).toBeNull();
    expect(
      (await receiveConsignmentItemSvc({ ...input, receivingOfficeId: 'office2' })).outcome,
    ).toBe('RECEIVED');
    expect((await sql`select receiving_office_id from parcels`)[0]?.receiving_office_id).toBe(
      'office2',
    );
  });

  test('location editors can add and rename an office, with case-insensitive unique names', async () => {
    const f = fixture();
    await f.location('anloga');
    const first = await f.request(
      'POST',
      '/anloga/receiving-offices',
      { name: ' Office 3 ' },
      'locations',
    );
    expect(first.status).toBe(200);
    const office = await first.json();
    expect(office).toMatchObject({ name: 'Office 3' });
    expect(
      (await f.request('POST', '/anloga/receiving-offices', { name: 'office 3' }, 'locations'))
        .status,
    ).toBe(409);
    expect(
      (
        await f.request(
          'PATCH',
          `/anloga/receiving-offices/${office.id}`,
          { name: 'Main Counter' },
          'locations',
        )
      ).status,
    ).toBe(200);
    const options = await f.request('GET', '/receiving-offices/options', undefined, 'locations');
    expect(await options.json()).toEqual([
      { id: office.id, name: 'Main Counter', locationId: 'anloga', locationName: 'anloga' },
    ]);
  });
}
