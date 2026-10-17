import { describe, expect, test } from 'bun:test';
import { app } from '@/server/app';
import { PermissionKeys } from '@/shared/permissions/constants';
import { inferReadPermissionByPath } from '@/shared/permissions/path-access-read';

describe('customer message app routes', () => {
  test('registers public submission separately from staff and ticket routes', () => {
    for (const [method, path] of [
      ['POST', '/v1/public/contact'],
      ['GET', '/v1/customer-messages/'],
      ['GET', '/v1/customer-messages/:id'],
      ['PATCH', '/v1/customer-messages/:id'],
    ])
      expect(app.routes.some((route) => route.method === method && route.path === path)).toBe(true);
    expect(inferReadPermissionByPath('/customer-messages')).toBe(
      PermissionKeys.CanReadCustomerMessages,
    );
    expect(inferReadPermissionByPath('/it-support/tickets')).toBe(
      PermissionKeys.CanReadItSupportTickets,
    );
  });
  test('never exposes the staff inbox or handling updates anonymously', async () => {
    for (const path of ['/v1/customer-messages', '/v1/customer-messages/example']) {
      const response = await app.handle(new Request(`http://localhost${path}`));
      expect(response.status).toBe(401);
      expect(response.headers.get('cache-control')).toBe('no-store');
    }
    const response = await app.handle(
      new Request('http://localhost/v1/customer-messages/example', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ status: 'resolved', updatedAt: new Date().toISOString() }),
      }),
    );
    expect(response.status).toBe(401);
  });
});
