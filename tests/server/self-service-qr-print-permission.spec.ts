import { describe, expect, test } from 'bun:test';
import { PermissionCatalog, PermissionKeys } from '@/shared/permissions/constants';
import {
  hasRequiredPermissionForPath,
  inferRequiredPermissionByPath,
} from '@/shared/permissions/path-access';

describe('Self-service QR print permission', () => {
  const printPath = '/branches/branch-123/qr-print';

  test('publishes a dedicated Branches permission in the catalog', () => {
    expect(
      PermissionCatalog.find(
        (permission) => permission.key === PermissionKeys.CanPrintSelfServiceQrCode,
      ),
    ).toEqual({
      key: PermissionKeys.CanPrintSelfServiceQrCode,
      description: 'Print branch self-service QR codes',
      group: 'Branches',
    });
  });

  test('maps the print route to the dedicated permission', () => {
    expect(inferRequiredPermissionByPath(printPath)).toBe(PermissionKeys.CanPrintSelfServiceQrCode);
  });

  test('allows the dedicated print permission without branch update access', () => {
    expect(
      hasRequiredPermissionForPath(printPath, [PermissionKeys.CanPrintSelfServiceQrCode]),
    ).toBe(true);
  });

  test('keeps print access for existing branch update roles', () => {
    expect(hasRequiredPermissionForPath(printPath, [PermissionKeys.CanUpdateBranches])).toBe(true);
  });

  test('blocks a role that has neither print nor update access', () => {
    expect(hasRequiredPermissionForPath(printPath, [PermissionKeys.CanReadBranches])).toBe(false);
  });
});
