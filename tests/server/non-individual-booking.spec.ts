import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { Elysia } from 'elysia';
import { eq } from 'drizzle-orm';
import { closeSql, db } from '@/db/config';
import {
  bookings,
  customers,
  parcels,
  roles,
  rolePermissions,
  UserStatus,
  users,
} from '@/db/schemas';
import { customersRoutes1 } from '@/server/features/customers/customer-routes/customer-directory.routes';
import { bookingWithParcelsRoutes } from '@/server/features/shipments/booking-with-parcels.routes';
import { assertBookingExemptionsUnchanged } from '@/server/features/shipments/charge-exemption';
import { errorHandler } from '@/server/middlewares/error-handler';
import { signAccessToken } from '@/server/utils/jwt';
import { PermissionKeys } from '@/shared/permissions/constants';
import { createChargeExemptionFixture } from '../utils/customer-charge-exemption-fixture';
import { exemptionBooking } from '../utils/customer-charge-exemption-cases';

describe.skipIf(process.env.NON_INDIVIDUAL_BOOKING_TEST !== '1')('other customer booking', () => {
  let fixture: Awaited<ReturnType<typeof createChargeExemptionFixture>>;
  let token: string;
  const app = new Elysia()
    .use(errorHandler)
    .group('/customers', (route) => route.use(customersRoutes1))
    .group('/shipments/bookings', (route) => route.use(bookingWithParcelsRoutes));

  beforeAll(async () => {
    fixture = await createChargeExemptionFixture('vipex_non_individual_booking_test');
    await db
      .insert(roles)
      .values({ id: 'role', companyId: 'company', name: 'Bookings', createdBy: 'officer' });
    await db.update(users).set({ status: UserStatus.ACTIVE }).where(eq(users.id, 'officer'));
    await db.insert(rolePermissions).values({
      roleId: 'role',
      companyId: 'company',
      permission: PermissionKeys.CanCreateBookingWithParcels,
    });
    token = await signAccessToken({ sub: 'officer' });
  });

  afterAll(async () => {
    await fixture?.cleanup();
    await closeSql();
  });

  function request(path: string, body?: unknown) {
    return app.handle(
      new Request(`http://localhost${path}`, {
        method: body ? 'POST' : 'GET',
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      }),
    );
  }

  function book(senderType: number, nonIndividualSender?: boolean) {
    const input = exemptionBooking(senderType, 'sender');
    const entries = input.parcels.map(
      ({ cashierUserId: _cashierUserId, branchId: _branchId, ...parcel }) => parcel,
    );
    return request('/shipments/bookings/create-with-parcels', {
      senderId: input.senderId,
      status: input.status,
      nonIndividualSender,
      parcels: entries,
    });
  }

  test('phone lookup filters Individuals and foreign profiles while retaining alternate-number matches', async () => {
    await db
      .update(customers)
      .set({ telephone2: '0240000000' })
      .where(eq(customers.id, 'customer-1'));
    await db
      .update(customers)
      .set({ telephone: '0240000000' })
      .where(eq(customers.id, 'other-company'));

    const path = '/customers/lookup/booking-by-telephone/0240000000';
    const response = await request(`${path}?nonIndividualOnly=true`);
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject([{ id: 'customer-1', customerType: 1 }]);
    const ordinary = await request(`${path}?limit=10`);
    expect(ordinary.status).toBe(200);
    expect(await ordinary.json()).toMatchObject([{ id: 'customer-0' }, { id: 'customer-1' }]);
  });

  test.each([1, 2, 3, 4, 5])('category %i can book with an Individual recipient', async (type) => {
    const response = await book(type, true);
    expect(response.status).toBe(201);
    const result = await response.json();
    const [parcel] = await db.select().from(parcels).where(eq(parcels.id, result.parcels[0].id));
    expect(parcel).toMatchObject({
      senderId: `customer-${type}`,
      receiverId: 'customer-0',
      chargePsw: type === 1 ? 2000 : 0,
      chargeExemptCustomerType: type === 1 ? null : type,
      relatedStaffId: type === 5 ? 'ama' : null,
    });
  });

  test('rejects an Individual sender in restricted mode and accepts ordinary booking', async () => {
    const before = (await db.select().from(bookings)).length;
    expect((await book(0, true)).status).toBe(400);
    expect((await db.select().from(bookings)).length).toBe(before);
    expect((await book(0)).status).toBe(201);
  });

  test('the locked save rejects a classification change from Business to Individual', async () => {
    await db.update(customers).set({ customerType: 0 }).where(eq(customers.id, 'customer-1'));
    try {
      await expect(
        db.transaction((tx) =>
          assertBookingExemptionsUnchanged(
            {
              ...exemptionBooking(1, 'sender'),
              nonIndividualSender: true,
            },
            tx,
          ),
        ),
      ).rejects.toMatchObject({ status: 409 });
    } finally {
      await db.update(customers).set({ customerType: 1 }).where(eq(customers.id, 'customer-1'));
    }
  });
});
