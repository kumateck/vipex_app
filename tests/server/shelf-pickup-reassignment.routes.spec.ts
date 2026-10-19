import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { Elysia } from 'elysia';
import { createId } from '@paralleldrive/cuid2';
import { eq } from 'drizzle-orm';
import { db } from '@/db/config';
import { parcels, rolePermissions, roles, users } from '@/db/schemas';
import { ParcelStatus } from '@/db/schemas/enums';
import { errorHandler } from '@/server/middlewares/error-handler';
import { parcelsRoutes } from '@/server/features/shipments/parcels.routes';
import { hasRequiredPermissionForPath } from '@/shared/permissions/path-access';
import { PermissionKeys } from '@/shared/permissions/constants';
import { createTestAccessToken } from '../utils/auth-session';
import { createShelfPickupFixture } from '../utils/shelf-pickup-fixture';

const app = new Elysia().use(errorHandler).group('/parcels', (route) => route.use(parcelsRoutes));
describe('dedicated shelf pickup reassignment API', () => {
  let fixture: Awaited<ReturnType<typeof createShelfPickupFixture>>;
  let other: Awaited<ReturnType<typeof createShelfPickupFixture>>;
  let token: string, otherToken: string;
  beforeAll(async () => {
    fixture = await createShelfPickupFixture();
    other = await createShelfPickupFixture();
    const sign = (id: string) =>
      createTestAccessToken({ userId: id, email: `${id}@example.test`, permissions: [] });
    [token, otherToken] = await Promise.all([sign(fixture.actor), sign(other.actor)]);
  });
  afterAll(async () => {
    await fixture?.cleanup();
    await other?.cleanup();
  });
  const request = (auth: string, path: string, body?: unknown) =>
    app.handle(
      new Request(`http://localhost/parcels${path}`, {
        method: body === undefined ? 'GET' : 'POST',
        headers: { authorization: `Bearer ${auth}`, 'content-type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
      }),
    );
  const list = async (search: string) => {
    const response = await request(token, `/shelf-picker-reassignments?search=${search}`);
    expect(response.status).toBe(200);
    return response.json() as Promise<{
      data: { id: string; pickerStaffId: string }[];
      meta: { totalRecords: number };
    }>;
  };

  test('mutation permission opens the new page and loads assigned parcels without general parcel read', async () => {
    const parcel = await fixture.parcel();
    expect(
      hasRequiredPermissionForPath('/parcels/shelf-pickup-reassignment', [
        PermissionKeys.CanUpdateParcelShelfPicker,
      ]),
    ).toBe(true);
    expect(
      hasRequiredPermissionForPath('/parcels/shelf-pickup-reassignment', [
        PermissionKeys.CanReadShelfPickerUpdate,
      ]),
    ).toBe(false);
    expect((await list(parcel.bookingCode)).data).toHaveLength(1);
    const staff = await request(token, '/shelf-picker-staff');
    expect(staff.status).toBe(200);
    expect(((await staff.json()) as { id: string }[]).map((row) => row.id)).toContain(
      fixture.newPicker,
    );
    const changed = await request(token, `/${parcel.id}/update-shelf-picker`, {
      userId: fixture.newPicker,
      expectedPickerStaffId: fixture.oldPicker,
    });
    expect(changed.status).toBe(200);
    expect(await changed.json()).toMatchObject({ success: true, pickerStaffId: fixture.newPicker });
    expect(
      (await request(otherToken, `/${parcel.id}/update-shelf-picker`, { userId: other.newPicker }))
        .status,
    ).toBe(404);
    expect(
      (await request(token, `/${parcel.id}/update-shelf-picker`, { userId: other.newPicker }))
        .status,
    ).toBe(400);
  });

  test('only active assignments appear, including legacy ticket staff, with no duplicate historical rows', async () => {
    const assigned = await fixture.parcel();
    await fixture.ticket(assigned.id, { day: 3, ended: true });
    await fixture.ticket(assigned.id);
    const rows = await list(assigned.bookingCode);
    expect(rows.data).toHaveLength(1);
    expect(rows.meta.totalRecords).toBe(1);
    const legacy = await fixture.parcel(null);
    await fixture.ticket(legacy.id, { day: 1 });
    expect((await list(legacy.bookingCode)).data[0]?.pickerStaffId).toBe(fixture.oldPicker);
    const ended = await fixture.parcel(null);
    await fixture.ticket(ended.id, { day: 2, ended: true });
    expect((await list(ended.bookingCode)).data).toHaveLength(0);
    const unassigned = await fixture.parcel(null);
    expect((await list(unassigned.bookingCode)).data).toHaveLength(0);
    await db
      .update(parcels)
      .set({ status: ParcelStatus.DELIVERED_BY_OFFICE })
      .where(eq(parcels.id, assigned.id));
    expect((await list(assigned.bookingCode)).data).toHaveLength(0);
    const foreign = await other.parcel();
    expect((await list(foreign.bookingCode)).data).toHaveLength(0);
  });

  test('branch staff remain available when the operator has no assigned location', async () => {
    await db.update(users).set({ locationId: null }).where(eq(users.id, fixture.actor));
    expect((await request(token, '/shelf-picker-staff')).status).toBe(200);
    const response = await request(token, '/shelf-picker-staff');
    expect(((await response.json()) as unknown[]).length).toBeGreaterThan(0);
    expect((await request('', '/shelf-picker-reassignments')).status).toBe(401);
  });

  test('read-only staff cannot list or execute reassignments', async () => {
    const roleId = createId();
    await db
      .insert(roles)
      .values({ id: roleId, companyId: fixture.companyId, name: roleId, createdBy: fixture.actor });
    await db.insert(rolePermissions).values({
      roleId,
      companyId: fixture.companyId,
      permission: PermissionKeys.CanReadShelfPickerUpdate,
    });
    await db.update(users).set({ roleId }).where(eq(users.id, fixture.oldPicker));
    const readToken = await createTestAccessToken({
      userId: fixture.oldPicker,
      email: `${fixture.oldPicker}@example.test`,
      permissions: [],
    });
    expect((await request(readToken, '/shelf-picker-reassignments')).status).toBe(403);
    const parcel = await fixture.parcel();
    expect(
      (await request(readToken, `/${parcel.id}/update-shelf-picker`, { userId: fixture.newPicker }))
        .status,
    ).toBe(403);
    expect((await request(readToken, '/shelf-picker-staff')).status).toBe(200);
  });
});
