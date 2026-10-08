import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { createId } from '@paralleldrive/cuid2';
import { eq } from 'drizzle-orm';
import { Elysia } from 'elysia';
import { db } from '@/db/config';
import { branches, parcels } from '@/db/schemas';
import { BranchType } from '@/db/schemas/enums';
import { errorHandler } from '@/server/middlewares/error-handler';
import { parcelsRoutes } from '@/server/features/shipments/parcels.routes';
import { createStorageClearanceFixture } from '../utils/storage-clearance/fixture';
import { createTestAccessToken } from '../utils/auth-session';

const app = new Elysia().use(errorHandler).group('/parcels', (route) => route.use(parcelsRoutes));

describe('storage clearance permissions and API scope', () => {
  let fixture: Awaited<ReturnType<typeof createStorageClearanceFixture>>;
  let other: Awaited<ReturnType<typeof createStorageClearanceFixture>>;
  let requesterToken: string;
  let approverToken: string;
  let financeToken: string;
  let otherToken: string;
  beforeAll(async () => {
    fixture = await createStorageClearanceFixture();
    other = await createStorageClearanceFixture();
    const token = (userId: string) =>
      createTestAccessToken({ userId, email: `${userId}@example.test`, permissions: [] });
    [requesterToken, approverToken, financeToken, otherToken] = await Promise.all([
      token(fixture.requester),
      token(fixture.approver),
      token(fixture.finance),
      token(other.requester),
    ]);
  });
  afterAll(async () => {
    await fixture?.cleanup();
    await other?.cleanup();
  });
  const request = (token: string, path = '', body?: unknown) =>
    app.handle(
      new Request(`http://localhost/parcels/storage-clearances${path}`, {
        method: body === undefined ? 'GET' : 'POST',
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
      }),
    );

  test('requester permission alone can search and read live unpaid accrual', async () => {
    const parcel = await fixture.parcel();
    const response = await request(requesterToken, `/parcel-search?search=${parcel.bookingCode}`);
    expect(response.status).toBe(200);
    const result = (await response.json()) as { data: { id: string }[] };
    expect(result.data.map((row) => row.id)).toContain(parcel.id);
    const accrual = await request(requesterToken, `/parcels/${parcel.id}`);
    expect(accrual.status).toBe(200);
    expect(await accrual.json()).toMatchObject({
      accruedDays: 5,
      dailyRatePsw: 200,
      outstandingPsw: 1000,
    });
    expect((await request(financeToken, `/parcels/${parcel.id}`)).status).toBe(403);
    expect((await request(otherToken, `/parcels/${parcel.id}`)).status).toBe(404);
  });

  test('a reason is required and invalid days cannot create a request', async () => {
    const parcel = await fixture.parcel();
    expect(
      (
        await request(requesterToken, '', {
          parcelId: parcel.id,
          requestedDays: 2,
          reason: '   ',
        })
      ).status,
    ).toBe(400);
    expect(
      (
        await request(requesterToken, '', {
          parcelId: parcel.id,
          requestedDays: 1.5,
          reason: 'Staff delay',
        })
      ).status,
    ).toBe(400);
    const fresh = await fixture.parcel(0);
    expect(
      (
        await request(requesterToken, '', {
          parcelId: fresh.id,
          clearAll: true,
          reason: 'Staff delay',
        })
      ).status,
    ).toBe(409);
  });

  test('approval, return, resubmit and execution enforce separate permissions', async () => {
    const parcel = await fixture.parcel();
    const created = await request(requesterToken, '', {
      parcelId: parcel.id,
      requestedDays: 2,
      reason: 'Staff delayed customer notification',
    });
    expect(created.status).toBe(200);
    const { id } = (await created.json()) as { id: string };
    expect((await request(requesterToken, `/${id}/approve`, {})).status).toBe(403);
    expect((await request(financeToken, `/${id}/reject`, { note: 'Wrong stage' })).status).toBe(
      403,
    );
    expect((await request(approverToken, `/${id}/approve`, {})).status).toBe(200);
    expect(
      (await request(approverToken, `/${id}/reject`, { note: 'Finance must review' })).status,
    ).toBe(403);
    expect((await request(requesterToken, `/${id}/execute`, {})).status).toBe(403);
    expect(
      (
        await request(financeToken, `/${id}/return-for-review`, {
          note: 'Review the number of days',
        })
      ).status,
    ).toBe(200);
    expect(
      (
        await request(requesterToken, `/${id}/resubmit`, {
          requestedDays: 1,
          reason: 'Corrected staff-delay days',
        })
      ).status,
    ).toBe(200);
    expect((await request(financeToken, `/${id}/execute`, {})).status).toBe(409);
    expect((await request(approverToken, `/${id}/approve`, {})).status).toBe(200);
    expect((await request(financeToken, `/${id}/execute`, {})).status).toBe(200);
    expect((await request(financeToken, `/${id}/execute`, {})).status).toBe(409);
    expect((await request(otherToken, `/${id}`)).status).toBe(404);
    const detail = await request(financeToken, `/${id}`);
    expect(detail.status).toBe(200);
    expect(await detail.json()).toMatchObject({ outstandingPsw: 800, accruedDays: 4 });
    const history = await request(financeToken, `?companyId=${other.companyId}`);
    expect(history.status).toBe(200);
    const result = (await history.json()) as { data: { companyId: string }[] };
    expect(result.data.every((row) => row.companyId === fixture.companyId)).toBe(true);
  });

  test('agency lookup excludes unrelated branches; head office can read company-wide', async () => {
    const branchId = createId();
    await db.insert(branches).values({
      id: branchId,
      companyId: fixture.companyId,
      name: branchId,
      createdBy: fixture.requester,
    });
    const parcel = await fixture.parcel();
    await db
      .update(parcels)
      .set({ sourceId: branchId, destinationId: branchId })
      .where(eq(parcels.id, parcel.id));
    const search = await request(requesterToken, `/parcel-search?search=${parcel.bookingCode}`);
    expect(((await search.json()) as { data: unknown[] }).data).toHaveLength(0);
    expect((await request(requesterToken, `/parcels/${parcel.id}`)).status).toBe(404);
    await db
      .update(branches)
      .set({ type: BranchType.HEADOFFICE })
      .where(eq(branches.id, fixture.branchId));
    expect((await request(requesterToken, `/parcels/${parcel.id}`)).status).toBe(200);
  });

  test('the former direct waiver route cannot bypass approval and Finance', async () => {
    const parcel = await fixture.parcel();
    const response = await app.handle(
      new Request(`http://localhost/parcels/${parcel.id}/storage-waivers`, {
        method: 'POST',
        headers: { authorization: `Bearer ${financeToken}`, 'content-type': 'application/json' },
        body: JSON.stringify({ amountPsw: 400, reason: 'Bypass attempt' }),
      }),
    );
    expect(response.status).toBe(404);
  });
});
