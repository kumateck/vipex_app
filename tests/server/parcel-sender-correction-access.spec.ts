import { describe, expect, test } from 'bun:test';
import { Elysia } from 'elysia';
import type { AuthUser } from '@/server/plugins/auth';
import { PermissionKeys } from '@/shared/permissions/constants';
import {
  assertParcelSenderCorrectionAccess,
  parcelSenderCorrectionRoutes,
} from '@/server/features/shipments/parcel-sender-correction.routes';

const user = (permissions: string[]): AuthUser => ({
  sub: 'actor',
  email: 'actor@example.test',
  companyId: 'company',
  branchId: 'source',
  permissions,
});
describe('sender correction access and route validation', () => {
  test('requires authentication and both update permissions', () => {
    expect(() => assertParcelSenderCorrectionAccess({ user: null })).toThrow('Unauthorized');
    for (const permissions of [
      [],
      [PermissionKeys.CanUpdateParcels],
      [PermissionKeys.CanUpdateCustomers],
    ])
      expect(() => assertParcelSenderCorrectionAccess({ user: user(permissions) })).toThrow(
        'Forbidden',
      );
    expect(() =>
      assertParcelSenderCorrectionAccess({
        user: user([PermissionKeys.CanUpdateParcels, PermissionKeys.CanUpdateCustomers]),
      }),
    ).not.toThrow();
  });
  test('accepts a valid phone query then rejects an unauthenticated lookup', async () => {
    const app = new Elysia().use(parcelSenderCorrectionRoutes);
    const response = await app.handle(
      new Request('http://localhost/parcel/sender-candidates?telephone=0551112222'),
    );
    expect(response.status).toBe(401);
  });
});
