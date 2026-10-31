import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { Elysia } from 'elysia';
import { eq } from 'drizzle-orm';
import { db } from '@/db/config';
import { parcels, users, UserStatus } from '@/db/schemas';
import { errorHandler } from '@/server/middlewares/error-handler';
import { parcelsRoutes } from '@/server/features/shipments/parcels.routes';
import { createCallCenterScopeFixture } from '../utils/call-center-scope-fixture';

const app = new Elysia().use(errorHandler).group('/parcels', (route) => route.use(parcelsRoutes));
describe('call center authenticated location scope', () => {
  let fixture: Awaited<ReturnType<typeof createCallCenterScopeFixture>>;
  let token: string;
  beforeAll(async () => {
    fixture = await createCallCenterScopeFixture();
    token = await fixture.token();
  });
  afterAll(async () => {
    await fixture?.cleanup();
  });
  const request = (path: string, body?: unknown, auth = token) =>
    app.handle(
      new Request(`http://localhost/parcels${path}`, {
        method: body === undefined ? 'GET' : 'POST',
        headers: { authorization: `Bearer ${auth}`, 'content-type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
      }),
    );
  const ids = async (path: string, auth = token) => {
    const response = await request(path, undefined, auth);
    expect(response.status).toBe(200);
    const result = (await response.json()) as { data: { id: string }[] } | { id: string }[];
    return (Array.isArray(result) ? result : result.data).map((row) => row.id);
  };

  test('location users see only their pickup location in assignment and call outcome queues', async () => {
    const own = await fixture.parcel();
    const other = await fixture.parcel(fixture.otherLocationId);
    const unlocated = await fixture.parcel(null);
    const foreign = await fixture.parcel(null, fixture.otherBranchId);
    for (const path of ['/call-center', '/call-center/assigned', '/?assignedToCurrentUser=true']) {
      const rows = await ids(path);
      expect(rows).toContain(own.id);
      for (const parcel of [other, unlocated, foreign]) expect(rows).not.toContain(parcel.id);
    }
    const forged = await ids(
      `/?assignedToCurrentUser=true&locationId=${fixture.otherLocationId}&destinationId=${fixture.otherBranchId}&companyId=other-company`,
    );
    expect(forged).toContain(own.id);
    expect(forged).not.toContain(other.id);
  });

  test('officer options exclude other locations and branch-only staff for location users', async () => {
    const staff = await ids('/assignment-staff');
    expect(staff).toContain(fixture.oldPicker);
    expect(staff).not.toContain(fixture.newPicker);
    expect(staff).not.toContain(fixture.secondPicker);
  });

  test('single and bulk assignment reject a different officer location', async () => {
    const parcel = await fixture.parcel();
    expect(
      (await request(`/${parcel.id}/assign-call-center`, { userId: fixture.newPicker })).status,
    ).toBe(400);
    expect(
      (
        await request('/bulk-assign-call-center', {
          parcelIds: [parcel.id],
          userId: fixture.newPicker,
        })
      ).status,
    ).toBe(400);
    expect(
      (await request(`/${parcel.id}/assign-call-center`, { userId: fixture.oldPicker })).status,
    ).toBe(200);
  });

  test('mixed-location bulk assignment fails atomically and direct foreign-location assignment fails', async () => {
    const own = await fixture.parcel();
    const other = await fixture.parcel(fixture.otherLocationId);
    expect(
      (await request(`/${other.id}/assign-call-center`, { userId: fixture.oldPicker })).status,
    ).toBe(404);
    expect(
      (
        await request('/bulk-assign-call-center', {
          parcelIds: [own.id, other.id],
          userId: fixture.oldPicker,
        })
      ).status,
    ).toBe(404);
    const [unchanged] = await db.select().from(parcels).where(eq(parcels.id, own.id));
    expect(unchanged?.callCenterAssignedToUserId).toBe(fixture.actor);
  });

  test('call saves and main receiver changes reject previously misassigned parcels at another location', async () => {
    const other = await fixture.parcel(fixture.otherLocationId);
    expect((await request(`/${other.id}/call-center/contact`, { outcome: 'pickup' })).status).toBe(
      404,
    );
    expect(
      (await request('/bulk-call-outcome', { parcelIds: [other.id], outcome: 'pickup' })).status,
    ).toBe(404);
    expect(
      (
        await request(`/${other.id}/call-outcome/change-main-receiver`, {
          telephone: '0248111128',
          fullname: 'New receiver',
          outcome: 'pickup',
        })
      ).status,
    ).toBe(404);
    const own = await fixture.parcel();
    expect((await request(`/${own.id}/call-center/contact`, { outcome: 'pickup' })).status).toBe(
      200,
    );
  });

  test('branch-only users see all branch locations, including parcels and staff without a location', async () => {
    await db.update(users).set({ locationId: null }).where(eq(users.id, fixture.actor));
    const own = await fixture.parcel();
    const other = await fixture.parcel(fixture.otherLocationId);
    const unlocated = await fixture.parcel(null);
    const foreign = await fixture.parcel(null, fixture.otherBranchId);
    for (const path of ['/call-center', '/call-center/assigned', '/?assignedToCurrentUser=true']) {
      const rows = await ids(path);
      for (const parcel of [own, other, unlocated]) expect(rows).toContain(parcel.id);
      expect(rows).not.toContain(foreign.id);
    }
    const staff = await ids('/assignment-staff');
    for (const id of [fixture.oldPicker, fixture.newPicker, fixture.secondPicker])
      expect(staff).toContain(id);
    expect(
      (await request(`/${other.id}/assign-call-center`, { userId: fixture.newPicker })).status,
    ).toBe(200);
    expect(
      (await request(`/${unlocated.id}/call-center/contact`, { outcome: 'pickup' })).status,
    ).toBe(200);
    expect(
      (await request(`/${foreign.id}/assign-call-center`, { userId: fixture.newPicker })).status,
    ).toBe(404);
  });

  test('inactive officers cannot receive parcels or appear in options', async () => {
    await db
      .update(users)
      .set({ status: UserStatus.INACTIVE })
      .where(eq(users.id, fixture.oldPicker));
    expect(await ids('/assignment-staff')).not.toContain(fixture.oldPicker);
    const parcel = await fixture.parcel();
    expect(
      (await request(`/${parcel.id}/assign-call-center`, { userId: fixture.oldPicker })).status,
    ).toBe(400);
  });

  test('assignment queues require authentication', async () => {
    expect((await request('/call-center', undefined, '')).status).toBe(401);
  });
});
