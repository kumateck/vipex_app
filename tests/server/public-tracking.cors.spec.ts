import { describe, expect, test } from 'bun:test';
import { app } from '@/server/app';

describe('public tracking CORS', () => {
  test('registers only the canonical v1 tracking route', async () => {
    expect(
      app.routes.some(
        (route) => route.method === 'GET' && route.path === '/v1/public/tracking/:trackingCode',
      ),
    ).toBe(true);
    for (const legacyPath of [
      '/public/tracking/A6624537UKT',
      '/v1/public/bookings/A6624537UKT/tracker',
      '/api/v1/bookings/A6624537UKT/tracker',
    ]) {
      const response = await app.handle(new Request(`http://localhost${legacyPath}`));
      expect(response.status).toBe(404);
      expect(await response.json()).toMatchObject({
        error: { message: 'Route not found', path: legacyPath },
      });
    }

    const invalidCode = 'A'.repeat(256);
    const response = await app.handle(
      new Request(`http://localhost/v1/public/tracking/${invalidCode}`),
    );
    expect(response.status).not.toBe(404);
  });

  for (const origin of ['https://vipexparcels.com', 'https://vipexparcel.com']) {
    test(`allows ${origin} during preflight`, async () => {
      const response = await app.handle(
        new Request('http://localhost/v1/public/tracking/A8718654QPY', {
          method: 'OPTIONS',
          headers: {
            Origin: origin,
            'Access-Control-Request-Method': 'GET',
            'Access-Control-Request-Headers': 'access-control-allow-origin',
          },
        }),
      );

      expect(response.status).toBeLessThan(400);
      expect(response.headers.get('access-control-allow-origin')).toBe(origin);
      expect(response.headers.get('access-control-allow-headers')).toContain(
        'Access-Control-Allow-Origin',
      );
    });
  }
});
