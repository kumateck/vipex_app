import { expect, test } from 'bun:test';
import { db, sql } from '@/db/config';
import { ParcelStatus, receivingOffices } from '@/db/schemas';
import type { ReceivingWorkflowFixture } from '../receiving-workflow-fixture';

const path = '/anloga/receiving-offices/office1';

async function createOffice(fixture: ReceivingWorkflowFixture) {
  await fixture.location('anloga');
  await db
    .insert(receivingOffices)
    .values({ id: 'office1', locationId: 'anloga', name: 'Office 1' });
}

export function registerOfficeDeletionCases(fixture: () => ReceivingWorkflowFixture) {
  test('deletes the only unused office and removes it from receiving options', async () => {
    const f = fixture();
    await createOffice(f);

    const response = await f.request('DELETE', path, undefined, 'locations');
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true });
    expect(
      await (await f.request('GET', '/receiving-offices/options', undefined, 'locations')).json(),
    ).toEqual([]);
    expect((await f.request('DELETE', path, undefined, 'locations')).status).toBe(404);

    expect((await f.request('POST', '/parcel/mark-received', {})).status).toBe(200);
    expect((await sql`select pickup_location_id, receiving_office_id from parcels`)[0]).toEqual({
      pickup_location_id: 'anloga',
      receiving_office_id: null,
    });
  });

  test('blocks deletion while active, delivered or deleted parcels still reference the office', async () => {
    const f = fixture();
    await createOffice(f);
    expect((await f.request('POST', '/parcel/mark-received', {})).status).toBe(200);

    for (const state of [
      { status: ParcelStatus.ARRIVED_AT_DESTINATION, isDeleted: false },
      { status: ParcelStatus.DELIVERED_BY_OFFICE, isDeleted: false },
      { status: ParcelStatus.CANCELLED, isDeleted: true },
    ]) {
      await sql`update parcels set status = ${state.status}, is_deleted = ${state.isDeleted}`;
      const response = await f.request('DELETE', path, undefined, 'locations');
      expect(response.status).toBe(409);
      expect(await response.json()).toMatchObject({
        error: { message: 'This receiving office is linked to a parcel and cannot be deleted' },
      });
    }

    expect(await db.select().from(receivingOffices)).toHaveLength(1);
    expect((await sql`select receiving_office_id from parcels`)[0]?.receiving_office_id).toBe(
      'office1',
    );
  });

  test('requires the correct location, company and location update permission', async () => {
    const f = fixture();
    await createOffice(f);
    await f.location('other');
    await f.location('foreign', 'destination', 'other-company');
    await db
      .insert(receivingOffices)
      .values({ id: 'foreign-office', locationId: 'foreign', name: 'Foreign Office' });
    expect(
      (await f.request('DELETE', '/other/receiving-offices/office1', undefined, 'locations'))
        .status,
    ).toBe(404);
    expect(
      (
        await f.request(
          'DELETE',
          '/foreign/receiving-offices/foreign-office',
          undefined,
          'locations',
        )
      ).status,
    ).toBe(404);

    await sql`delete from role_permissions where permission = 'CanUpdateLocations'`;
    expect((await f.request('DELETE', path, undefined, 'locations')).status).toBe(403);
    expect(await db.select().from(receivingOffices)).toHaveLength(2);
  });

  test('concurrent receiving and deletion cannot leave a parcel linked to a deleted office', async () => {
    const f = fixture();
    await createOffice(f);
    const [received, deleted] = await Promise.all([
      f.request('POST', '/parcel/mark-received', { receivingOfficeId: 'office1' }),
      f.request('DELETE', path, undefined, 'locations'),
    ]);
    const [parcel] = await sql`select receiving_office_id from parcels`;
    if (deleted.status === 200) {
      expect(received.status).toBe(400);
      expect(parcel?.receiving_office_id).toBeNull();
    } else {
      expect(deleted.status).toBe(409);
      expect(received.status).toBe(200);
      expect(parcel?.receiving_office_id).toBe('office1');
      expect(await db.select().from(receivingOffices)).toHaveLength(1);
    }
  });
}
