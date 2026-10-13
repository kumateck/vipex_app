import { describe, expect, test } from 'bun:test';
import {
  assertParcelInformationEditAccess,
  parcelInformationEditRoutes,
} from '@/server/features/shipments/parcel-information-edit.routes';
import { PermissionKeys } from '@/shared/permissions/constants';
import type { AuthUser } from '@/server/plugins/auth';

const user = (permissions: string[]): AuthUser => ({
  sub: 'actor',
  email: 'actor@test.local',
  companyId: 'company-a',
  branchId: 'branch-a',
  permissions,
});
const body = { receiver: { id: 'receiver', fullname: 'Corrected Name' } };

describe('parcel information edit access', () => {
  test('registers a separate parcel edit endpoint', () => {
    expect(
      parcelInformationEditRoutes.routes.some(
        (r) => r.method === 'POST' && r.path === '/:id/edit-information',
      ),
    ).toBe(true);
  });
  test('requires authentication', () => {
    expect(() => assertParcelInformationEditAccess({ user: null, body })).toThrow('Unauthorized');
  });
  test('customer management permission alone cannot change parcel history', () => {
    expect(() =>
      assertParcelInformationEditAccess({ user: user([PermissionKeys.CanUpdateCustomers]), body }),
    ).toThrow('Forbidden');
  });
  test.each([
    PermissionKeys.CanReadParcelIncoming,
    PermissionKeys.CanCompleteOfficePickup,
    PermissionKeys.CanCreateReceiverPayments,
    PermissionKeys.CanReadParcelScan,
    PermissionKeys.CanReadShelfPickerUpdate,
    PermissionKeys.CanUpdateParcels,
  ])('receiver edits also require customer permission for %s', (permission) => {
    expect(() => assertParcelInformationEditAccess({ user: user([permission]), body })).toThrow(
      'Forbidden',
    );
    expect(() =>
      assertParcelInformationEditAccess({
        user: user([permission, PermissionKeys.CanUpdateCustomers]),
        body,
      }),
    ).not.toThrow();
    expect(() =>
      assertParcelInformationEditAccess({
        user: user([permission]),
        body: { parcelDetails: 'Box' },
      }),
    ).not.toThrow();
  });
});
