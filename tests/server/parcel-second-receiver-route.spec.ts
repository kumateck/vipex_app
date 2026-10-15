import { describe, expect, test } from 'bun:test';
import { app } from '@/server/app';
import { PermissionCatalog, PermissionKeys } from '@/shared/permissions/constants';

const routePath = '/v1/shipments/parcels/:id/second-receiver';
const parcelPath = '/v1/shipments/parcels/0123456789012345678901234/second-receiver';

describe('parcel second receiver routes', () => {
  test('publishes a dedicated Deliveries permission', () => {
    expect(
      PermissionCatalog.find(
        (permission) => permission.key === PermissionKeys.CanManageParcelSecondReceiver,
      )?.group,
    ).toBe('Deliveries');
  });

  test.each(['PUT', 'DELETE'])('registers %s and requires authentication', async (method) => {
    expect(app.routes.some((route) => route.method === method && route.path === routePath)).toBe(
      true,
    );
    const response = await app.handle(
      new Request(`http://localhost${parcelPath}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body:
          method === 'PUT'
            ? JSON.stringify({ fullname: 'Ama Owusu', telephone: '0248111128' })
            : undefined,
      }),
    );
    expect(response.status).toBe(401);
  });
});
