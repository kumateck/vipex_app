import { describe, expect, test } from 'bun:test';
import { PermissionKeys } from '@/shared/permissions/constants';
import { hasRequiredPermissionForPath } from '@/shared/permissions/path-access';

describe('storage clearance page access', () => {
  const history = '/parcels/storage-clearances';
  const request = PermissionKeys.CanRequestParcelStorageClearance;
  const approve = PermissionKeys.CanApproveParcelStorageClearance;
  const execute = PermissionKeys.CanExecuteParcelStorageClearance;
  test('each workflow role can inspect history without extra read permissions', () => {
    for (const permission of [
      request,
      approve,
      execute,
      PermissionKeys.CanReadParcelStorageClearances,
    ]) {
      expect(hasRequiredPermissionForPath(history, [permission])).toBe(true);
    }
    expect(hasRequiredPermissionForPath(history, [])).toBe(false);
  });
  test('action pages retain their own permissions', () => {
    expect(hasRequiredPermissionForPath(`${history}/new`, [request])).toBe(true);
    expect(hasRequiredPermissionForPath(`${history}/approvals`, [request])).toBe(false);
    expect(hasRequiredPermissionForPath(`${history}/execution`, [approve])).toBe(false);
    expect(hasRequiredPermissionForPath(`${history}/execution`, [execute])).toBe(true);
  });
});
