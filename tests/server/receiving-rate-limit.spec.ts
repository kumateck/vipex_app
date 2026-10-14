import { isReceivingRequest } from '@/server/middlewares/rate-limit-receiving';
import { describe, expect, test } from 'bun:test';
import { Elysia } from 'elysia';
import { ParcelStatus } from '@/db/schemas/enums';
import { createRateLimitPlugin } from '@/server/middlewares/rate-limit';
import { MemoryCacheStore } from '@/server/services/cache/memory-cache';
import { signAccessToken } from '@/server/utils/jwt';

const app = new Elysia()
  .use(
    createRateLimitPlugin({
      windowSeconds: 60,
      maxRequests: 2,
      staffReadMultiplier: 1,
      cache: new MemoryCacheStore(),
    }),
  )
  .get('/v1/shipments/parcels', () => ({ ok: true }))
  .get('/v1/shipments/parcels/:id/details', () => ({ ok: true }))
  .patch('/v1/shipments/parcels/:id', () => ({ ok: true }))
  .post('/v1/shipments/parcels/:id/mark-received', () => ({ ok: true }))
  .post('/v1/shipments/consignments/:id/receive', () => ({ ok: true }));
const call = (path: string, token: string, method = 'GET', body?: unknown) =>
  app.handle(
    new Request(`http://localhost${path}`, {
      method,
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
        'x-forwarded-for': 'receiving-test',
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  );

describe('receiving request quota exemptions', () => {
  test('arrival detection leaves the request body available for the receiving endpoint', async () => {
    const body = { status: ParcelStatus.ARRIVED_AT_DESTINATION };
    const request = new Request('http://localhost/v1/shipments/parcels/parcel', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    expect(await isReceivingRequest(request, true)).toBe(true);
    expect(await request.json()).toEqual(body);
  });
  test('authenticated receiving search, details and confirmation stay available beyond quota', async () => {
    const token = await signAccessToken({ sub: 'scan-staff' });
    for (let attempt = 0; attempt < 6; attempt++) {
      for (const [path, method, body] of [
        [`/v1/shipments/parcels?status=${ParcelStatus.IN_TRANSIT}`, 'GET', undefined],
        ['/v1/shipments/parcels/parcel/details', 'GET', undefined],
        ['/v1/shipments/parcels/parcel', 'PATCH', { status: ParcelStatus.ARRIVED_AT_DESTINATION }],
        ['/v1/shipments/parcels/parcel/mark-received', 'POST', {}],
        ['/v1/shipments/consignments/consignment/receive', 'POST', { code: 'parcel' }],
      ] as const) {
        const response = await call(path, token, method, body);
        expect(response.status).toBe(200);
        expect(response.headers.get('x-ratelimit-limit')).toBeNull();
      }
    }
  });
  test('invalid tokens, unrelated searches and other parcel status changes remain limited', async () => {
    const token = await signAccessToken({ sub: 'other-staff' });
    for (const [path, auth, method, body] of [
      [
        `/v1/shipments/parcels?status=${ParcelStatus.IN_TRANSIT}`,
        'invalid-token',
        'GET',
        undefined,
      ],
      ['/v1/shipments/parcels', token, 'GET', undefined],
      ['/v1/shipments/parcels/other', token, 'PATCH', { status: ParcelStatus.AWAITING_PICKUP }],
    ] as const) {
      expect((await call(path, auth, method, body)).status).toBe(200);
      expect((await call(path, auth, method, body)).status).toBe(200);
      expect((await call(path, auth, method, body)).status).toBe(429);
    }
  });
});
