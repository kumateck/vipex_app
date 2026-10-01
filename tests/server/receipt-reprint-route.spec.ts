import { describe, expect, test } from 'bun:test';
import { app } from '@/server/app';

describe('receipt reprint tax route', () => {
  test('requires authentication and registers the v1 path', async () => {
    const path = '/v1/shipments/parcels/0123456789012345678901234/receipt-reprint-tax';
    expect(
      app.routes.some(
        (route) =>
          route.method === 'GET' && route.path === '/v1/shipments/parcels/:id/receipt-reprint-tax',
      ),
    ).toBe(true);
    const response = await app.handle(new Request(`http://localhost${path}`));
    expect(response.status).toBe(401);
  });
});
