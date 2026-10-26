import { Elysia } from 'elysia';
import { maintenanceRoutes } from '@/server/features/maintenance';
import { errorHandler } from '@/server/middlewares/error-handler';
import { signAccessToken } from '@/server/utils/jwt';
import { expect, test } from 'bun:test';
import { db, sql } from '@/db/config';
import { deliveries } from '@/db/schemas';
import type { MaintenanceBookingFixture } from '../maintenance-booking-fixture';

export function registerInspectionCases(fixture: () => MaintenanceBookingFixture) {
  test('booking search runs both application branch queries in the maintenance snapshot', async () => {
    const result = await fixture().preview('check-parcel-booking-search');
    expect(result.result).toMatchObject({
      readyToApply: false,
      details: {
        reports: [
          { side: 'sourceId', targetFound: true, total: 1 },
          { side: 'destinationId', targetFound: true, total: 1 },
        ],
      },
    });
  });
  test('delivery-fee inspection returns evidence only for the selected company parcel', async () => {
    const result = await fixture().preview('inspect-cleared-delivery-fee');
    expect(result.result).toMatchObject({
      readyToApply: false,
      details: { parcelId: 'parcel', deliveries: [], payments: [] },
    });
    expect(
      Number((await sql`select planned_tobepaid_psw from parcels`)[0]!.planned_tobepaid_psw),
    ).toBe(0);
  });
  test('delivery inspection finds returned doorstep fee candidates without changing them', async () => {
    await db.insert(deliveries).values({
      id: 'delivery',
      parcelId: 'parcel',
      mode: 1,
      status: 'RETURNED_TO_OFFICE',
      chargePsw: 0,
      returnedAt: new Date('2026-10-20T12:00:00Z'),
      createdBy: 'admin',
    });
    const result = await fixture().preview('inspect-cleared-delivery-fee');
    expect(result.result!.summary).toContain('1 cleared delivery fee');
    expect(result.result!.readyToApply).toBe(false);
    expect(result.result!.details.deliveries).toHaveLength(1);
  });
  test('HTTP schema and execution accept the new operation-specific confirmation', async () => {
    const f = fixture();
    const app = new Elysia()
      .use(errorHandler)
      .group('/v1/maintenance', (routes) => routes.use(maintenanceRoutes));
    const token = await signAccessToken(f.admin);
    const run = (body: unknown) =>
      app.handle(
        new Request('http://localhost/v1/maintenance/runs', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }),
      );
    const previewResponse = await run({
      operationId: 'repair-parcel-financial-state',
      params: { bookingCode: 'BOOK1' },
      mode: 'preview',
    });
    expect(previewResponse.status).toBe(200);
    const preview = await previewResponse.json();
    const applied = await run({
      operationId: 'repair-parcel-financial-state',
      params: { bookingCode: 'BOOK1' },
      mode: 'execute',
      previewRunId: preview.id,
      confirmRepair: true,
    });
    expect(applied.status).toBe(200);
    expect(
      Number((await sql`select planned_tobepaid_psw from parcels`)[0]!.planned_tobepaid_psw),
    ).toBe(5000);
  });
}
