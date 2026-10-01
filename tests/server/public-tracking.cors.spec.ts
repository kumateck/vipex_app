import { describe, expect, test } from 'bun:test';
import { app } from '@/server/app';

describe('public tracking CORS', () => {
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
