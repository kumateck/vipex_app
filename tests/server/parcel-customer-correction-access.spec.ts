import { describe, expect, test } from 'bun:test';
import { Elysia } from 'elysia';
import type { AuthUser } from '@/server/plugins/auth';
import { PermissionKeys } from '@/shared/permissions/constants';
import { hasRequiredPermissionForPath } from '@/shared/permissions/path-access';
import {
  assertCustomerCorrectionAccess,
  customerCorrectionRoutes,
  correctionRestriction,
  normalizeCorrection,
} from '@/server/features/shipments/customer-corrections';

const relink = PermissionKeys.CanCorrectParcelCustomers;
const profile = PermissionKeys.CanOverrideParcelCustomerDetails;
const user = (permissions: string[]): AuthUser => ({
  sub: 'actor',
  email: 'test@example.test',
  companyId: 'company',
  branchId: 'third-branch',
  permissions,
});

describe('parcel customer correction permissions and cutoff', () => {
  test('ordinary customer and parcel permissions do not grant correction access', () => {
    expect(() => assertCustomerCorrectionAccess({ user: null })).toThrow('Unauthorized');
    expect(() =>
      assertCustomerCorrectionAccess({
        user: user([PermissionKeys.CanUpdateCustomers, PermissionKeys.CanUpdateParcels]),
      }),
    ).toThrow('Forbidden');
    for (const permission of [relink, profile]) {
      expect(() => assertCustomerCorrectionAccess({ user: user([permission]) })).not.toThrow();
      expect(hasRequiredPermissionForPath('/parcels/customer-corrections', [permission])).toBe(
        true,
      );
    }
    expect(hasRequiredPermissionForPath('/parcels/customer-corrections', [])).toBe(false);
  });
  test('each correction mode requires its dedicated grant', () => {
    expect(() =>
      assertCustomerCorrectionAccess({ user: user([relink]), body: { mode: 'profile' } }),
    ).toThrow('Forbidden');
    expect(() =>
      assertCustomerCorrectionAccess({ user: user([profile]), body: { mode: 'relink' } }),
    ).toThrow('Forbidden');
    for (const [permission, mode] of [
      [relink, 'relink'],
      [profile, 'profile'],
    ]) {
      expect(() =>
        assertCustomerCorrectionAccess({ user: user([permission!]), body: { mode } }),
      ).not.toThrow();
    }
  });
  test('blocks final states and any confirmed handover', () => {
    for (const status of [0, 1, 2, 3, 4, 5, 7, 8, 9, 12, 15, 16, 20]) {
      expect(
        correctionRestriction({ status, confirmedAt: null, deliveryConfirmationSnapshot: null }),
      ).toBeNull();
    }
    for (const status of [6, 10, 11, 13, 14, 17, 18, 19, 99]) {
      expect(
        correctionRestriction({ status, confirmedAt: null, deliveryConfirmationSnapshot: null }),
      ).toBeTruthy();
    }
    expect(
      correctionRestriction({
        status: 5,
        confirmedAt: new Date(),
        deliveryConfirmationSnapshot: null,
      }),
    ).toBeTruthy();
  });
  test('validates normalized name, phones, reason and relink selection', () => {
    const input = {
      parcelId: 'parcel',
      expectedVersion: 'version',
      expectedCustomerVersion: 'version',
      party: 'receiver' as const,
      mode: 'profile' as const,
      updateName: true,
      fullname: ' Name ',
      telephone: '024 555-5555',
      telephone2: null,
      reason: ' Correct number ',
    };
    expect(normalizeCorrection(input)).toMatchObject({
      fullname: 'Name',
      telephone: '0245555555',
      reason: 'Correct number',
    });
    for (const patch of [
      { fullname: ' ' },
      { telephone: '123' },
      { telephone2: '0245555555' },
      { reason: ' ' },
      { mode: 'relink' as const },
    ]) {
      expect(() => normalizeCorrection({ ...input, ...patch })).toThrow();
    }
  });
  test('lookup endpoint requires an authenticated session', async () => {
    const app = new Elysia().use(customerCorrectionRoutes);
    const response = await app.handle(
      new Request('http://localhost/customer-corrections/lookup?bookingCode=KN3432637L'),
    );
    expect(response.status).toBe(401);
  });
});
