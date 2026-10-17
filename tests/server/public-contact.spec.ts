import { describe, expect, mock, test } from 'bun:test';
import { Elysia } from 'elysia';
import { createPublicContactRoutes } from '@/server/features/public-contact/routes';
import { createPublicContactService } from '@/server/features/public-contact/service';
import { MemoryCacheStore } from '@/server/services/cache/memory-cache';
import { corsPlugin } from '@/server/plugins/cors';
import { requirePermissions } from '@/server/plugins/auth';
import { PermissionKeys } from '@/shared/permissions/constants';
import type { AuthUser } from '@/server/plugins/auth';

const message = {
  type: 'complaint' as const,
  name: '  Ama Owusu  ',
  phone: '+233 204 353 512',
  email: 'ama@example.com',
  branch: 'accra-circle',
  trackingCode: 'TEST123',
  message: '  My parcel has not arrived.  ',
  submissionId: '40686911-453e-40b1-87c2-5c35be55d773',
};
function setup(companyId: string | undefined = 'company-a', enabled = true) {
  const save = mock(async () => {});
  const deps = { companyId: () => companyId, isEnabled: mock(async () => enabled), save };
  const app = new Elysia()
    .use(corsPlugin)
    .onError(({ error, code, set }) => {
      set.status =
        code === 'VALIDATION' || code === 'PARSE'
          ? 400
          : 'status' in error
            ? Number(error.status)
            : 500;
      return { error: { message: 'Request failed' } };
    })
    .use(createPublicContactRoutes(deps, new MemoryCacheStore()));
  const post = (body: unknown = message, headers: Record<string, string> = {}) =>
    app.handle(
      new Request('http://localhost/v1/public/contact', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          origin: 'https://vipexparcels.com',
          'x-forwarded-for': '192.0.2.1',
          ...headers,
        },
        body: JSON.stringify(body),
      }),
    );
  return { app, post, deps, save };
}

describe('public customer inbox', () => {
  test('accepts each message type without staff authentication and returns only a reference', async () => {
    for (const type of ['enquiry', 'complaint', 'feedback']) {
      const { post, save } = setup();
      const response = await post({ ...message, type });
      expect(response.status).toBe(201);
      const body = await response.json();
      expect(Object.keys(body)).toEqual(['reference']);
      expect(body.reference).toMatch(/^WEB-[A-Z0-9]{24}$/);
      expect(save).toHaveBeenCalledWith(
        expect.objectContaining({
          companyId: 'company-a',
          type,
          name: 'Ama Owusu',
          message: 'My parcel has not arrived.',
        }),
      );
      expect(response.headers.get('cache-control')).toBe('no-store');
      expect(response.headers.get('x-robots-tag')).toContain('noindex');
    }
  });

  test('rejects invalid, blank, oversized and spam submissions before persistence', async () => {
    const invalid = [
      { type: 'internal_issue' },
      { name: '  ' },
      { phone: '123456789abc' },
      { phone: '123' },
      { email: 'not-an-email' },
      { message: '          ' },
      { message: 'x'.repeat(5001) },
      { trackingCode: 'x'.repeat(51) },
      { website: 'spam.example' },
      { submissionId: 'not-a-uuid' },
    ];
    for (const patch of invalid) {
      const { post, save } = setup();
      expect((await post({ ...message, ...patch })).status).toBe(400);
      expect(save).not.toHaveBeenCalled();
    }
  });

  test('derives tenancy from configuration and never trusts an anonymous company ID', async () => {
    const { post, save } = setup();
    const response = await post({
      ...message,
      companyId: 'foreign-company',
      status: 'resolved',
      updatedBy: 'staff',
    });
    expect([201, 400]).toContain(response.status);
    if (response.status === 201)
      expect(save).toHaveBeenCalledWith(expect.objectContaining({ companyId: 'company-a' }));
    else expect(save).not.toHaveBeenCalled();
  });

  test('fails closed when no destination is configured or the company is unavailable', async () => {
    for (const deps of [
      { companyId: () => undefined, isEnabled: async () => true },
      { companyId: () => 'deleted-company', isEnabled: async () => false },
    ]) {
      const save = mock(async () => {});
      await expect(createPublicContactService({ ...deps, save })(message)).rejects.toMatchObject({
        status: 503,
      });
      expect(save).not.toHaveBeenCalled();
    }
  });

  test('rate limits per IP, supplies a retry time, and does not let bearer changes bypass the quota', async () => {
    const { post, save } = setup();
    for (let n = 0; n < 5; n++) expect((await post()).status).toBe(201);
    const blocked = await post(message, { authorization: 'Bearer different-token' });
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get('retry-after')).toBe('900');
    expect(save).toHaveBeenCalledTimes(5);
    expect((await post(message, { 'x-forwarded-for': '192.0.2.2' })).status).toBe(201);
  });

  test('supports website JSON preflights and blocks unrelated browser origins', async () => {
    const { app, post, save } = setup();
    const response = await app.handle(
      new Request('http://localhost/v1/public/contact', {
        method: 'OPTIONS',
        headers: {
          origin: 'https://vipexparcels.com',
          'access-control-request-method': 'POST',
          'access-control-request-headers': 'content-type',
        },
      }),
    );
    expect(response.status).toBeLessThan(400);
    expect(response.headers.get('access-control-allow-origin')).toBe('https://vipexparcels.com');
    expect((await post(message, { origin: 'https://unrelated.example' })).status).toBe(403);
    expect(save).not.toHaveBeenCalled();
  });

  test('never reports success if persistence fails', async () => {
    const { post, save } = setup();
    save.mockRejectedValueOnce(new Error('Storage unavailable'));
    expect((await post()).status).toBe(500);
  });

  test('uses independent inbox permissions, not internal support permissions', () => {
    const itStaff = {
      permissions: [
        PermissionKeys.CanReadItSupportTickets,
        PermissionKeys.CanUpdateItSupportTickets,
      ],
    } as AuthUser;
    expect(() =>
      requirePermissions(PermissionKeys.CanReadCustomerMessages)({ user: itStaff }),
    ).toThrow();
    expect(() =>
      requirePermissions(PermissionKeys.CanManageCustomerMessages)({ user: itStaff }),
    ).toThrow();
  });
});
