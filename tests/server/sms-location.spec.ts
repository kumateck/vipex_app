import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { eq } from 'drizzle-orm';
import { db, sql, closeSql } from '@/db/config';
import { branches, companies, customers, locations, parcels, users } from '@/db/schemas';
import { createLocationSvc, updateLocationSvc } from '@/server/features/locations/service';
import { getLocationRepo } from '@/server/features/locations/repository';
import { getLocationByIdCtrl } from '@/server/features/locations/controller';
import {
  getNotificationSenderContextRepo,
  getParcelRecipientsRepo,
} from '@/server/features/notification-hub/repository';
import { getParcelSmsLocationRepo } from '@/server/features/notification-hub/sms-location.repository';
import { createIsolatedSchemaFixture } from '../utils/isolated-schema-fixture';

const enabled = process.env.SMS_LOCATION_TEST === '1';
describe.skipIf(!enabled)('location SMS telephone PostgreSQL integration', () => {
  let fixture: Awaited<ReturnType<typeof createIsolatedSchemaFixture>>;
  beforeAll(async () => {
    fixture = await createIsolatedSchemaFixture('vipex_sms_location_test');
    await db.insert(companies).values({
      id: 'company',
      name: 'Synthetic',
      code: 'SYN',
      type: 'courier',
      createdBy: 'test',
    });
    await db.insert(branches).values([
      {
        id: 'branch',
        companyId: 'company',
        name: 'Branch',
        telephone: '0309999999',
        createdBy: 'test',
      },
      { id: 'other', companyId: 'company', name: 'Other', createdBy: 'test' },
    ]);
    await db.insert(locations).values({
      id: 'existing',
      companyId: 'company',
      branchId: 'branch',
      name: 'Existing desk',
      createdBy: 'test',
    });
    // Reproduce the pre-migration table and prove this additive migration is idempotent.
    await sql.unsafe('ALTER TABLE locations DROP COLUMN telephone');
    const migration = await Bun.file('drizzle/0089_location_telephone.sql').text();
    await sql.unsafe(migration);
    await sql.unsafe(migration);
  });
  afterAll(async () => {
    await fixture?.cleanup();
    await closeSql();
  });

  test('migration preserves existing names and leaves telephone unset', async () => {
    expect(await getLocationRepo('existing')).toMatchObject({
      name: 'Existing desk',
      telephone: null,
    });
  });
  test('saves a separate trimmed telephone, supports clearing, and preserves it on partial updates', async () => {
    const { id } = await createLocationSvc({
      companyId: 'company',
      branchId: 'branch',
      name: 'Adum desk',
      telephone: ' 0300000001 ',
      createdBy: 'test',
    });
    expect(id).toBeTruthy();
    expect(await getLocationByIdCtrl(id!)).toMatchObject({ telephone: '0300000001' });
    await updateLocationSvc(id!, { name: 'Adum collection desk' });
    expect(await getLocationRepo(id!)).toMatchObject({ telephone: '0300000001' });
    await updateLocationSvc(id!, { telephone: '' });
    expect(await getLocationRepo(id!)).toMatchObject({ telephone: null });
    await expect(updateLocationSvc(id!, { telephone: '1'.repeat(31) })).rejects.toThrow(
      '30 characters',
    );
    await updateLocationSvc(id!, { telephone: '0240000001' });
    await db.update(locations).set({ isDeleted: true }).where(eq(locations.id, id!));
    expect(
      await createLocationSvc({
        companyId: 'company',
        branchId: 'branch',
        name: 'Adum collection desk',
        createdBy: 'test',
      }),
    ).toEqual({ id });
    expect(await getLocationRepo(id!)).toMatchObject({ telephone: '0240000001', isDeleted: false });
  });
  test('uses the assigned location telephone rather than the branch number and rejects mismatched scope', async () => {
    await updateLocationSvc('existing', { telephone: '0300000002' });
    await db.insert(users).values({
      id: 'actor',
      roleId: 'synthetic',
      fullname: 'Synthetic sender',
      email: 'sender@example.test',
      telephone: '0240000000',
      companyId: 'company',
      branchId: 'branch',
      locationId: 'existing',
      createdBy: 'test',
    });
    await db.insert(customers).values({
      id: 'receiver',
      companyId: 'company',
      fullname: 'Synthetic receiver',
      telephone: '0200000000',
      createdBy: 'test',
    });
    await db.insert(parcels).values({
      id: 'parcel',
      companyId: 'company',
      sourceId: 'branch',
      destinationId: 'branch',
      pickupLocationId: 'existing',
      bookingId: 'booking',
      bookingCode: 'SYN-BOOK',
      trackingCode: 'SYN-TRACK',
      senderId: 'receiver',
      receiverId: 'receiver',
      parcelDetails: 'Box',
      parcelContent: 'Books',
    });
    expect(
      await getNotificationSenderContextRepo({ companyId: 'company', userId: 'actor' }),
    ).toMatchObject({ location: 'Existing desk', locationPhone: '0300000002' });
    expect(await getParcelRecipientsRepo('company', 'parcel')).toMatchObject({
      location: 'Existing desk',
      locationPhone: '0300000002',
      branchPhone: '0309999999',
    });
    expect(await getParcelSmsLocationRepo('company', 'parcel')).toMatchObject({
      location: 'Existing desk',
      locationPhone: '0300000002',
    });
    expect(await getParcelSmsLocationRepo('foreign', 'parcel')).toBeNull();
    await db.update(locations).set({ branchId: 'other' }).where(eq(locations.id, 'existing'));
    expect(await getParcelSmsLocationRepo('company', 'parcel')).toMatchObject({
      location: null,
      locationPhone: null,
    });
    expect(
      await getNotificationSenderContextRepo({ companyId: 'company', userId: 'actor' }),
    ).toMatchObject({ location: null, locationPhone: null });
  });
});
