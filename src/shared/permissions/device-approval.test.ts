import { describe, expect, test } from 'bun:test';
import { BranchType } from '@/db/schemas/enums';
import { PermissionKeys } from './constants';
import { canApproveRegisteredDevices } from './device-approval';

describe('canApproveRegisteredDevices', () => {
  test('allows the dedicated permission from any branch', () => {
    expect(
      canApproveRegisteredDevices({
        permissions: [PermissionKeys.CanApproveRegisteredDevices],
        branchType: BranchType.AGENCY,
      }),
    ).toBe(true);
  });

  test('keeps the legacy head-office CanUpdateUsers fallback', () => {
    const permissions = [PermissionKeys.CanUpdateUsers];
    expect(canApproveRegisteredDevices({ permissions, branchType: BranchType.HEADOFFICE })).toBe(
      true,
    );
    expect(canApproveRegisteredDevices({ permissions, branchType: BranchType.AGENCY })).toBe(false);
  });

  test('denies users without either grant', () => {
    expect(
      canApproveRegisteredDevices({
        permissions: [PermissionKeys.CanReadUsers],
        branchType: BranchType.HEADOFFICE,
      }),
    ).toBe(false);
    expect(canApproveRegisteredDevices({ permissions: undefined, branchType: null })).toBe(false);
  });
});
