import { describe, expect, it } from 'bun:test';
import {
  HiddenPermissionKeysInUi,
  PermissionCatalog,
  PermissionCatalogUi,
  PermissionKeys,
} from '@/shared/permissions/constants';
import { inferRequiredPermissionByPath } from '@/shared/permissions/path-access';

describe('user password management permission', () => {
  it('protects the page with its dedicated permission', () => {
    expect(inferRequiredPermissionByPath('/users/password-management')).toBe(
      PermissionKeys.CanSetUserPassword,
    );
  });

  it('keeps the reserved permission out of normal role assignment UI', () => {
    expect(
      PermissionCatalog.some(({ key }) => key === PermissionKeys.CanSetUserPassword),
    ).toBeTrue();
    expect(HiddenPermissionKeysInUi.has(PermissionKeys.CanSetUserPassword)).toBeTrue();
    expect(
      PermissionCatalogUi.some(({ key }) => key === PermissionKeys.CanSetUserPassword),
    ).toBeFalse();
  });
});
