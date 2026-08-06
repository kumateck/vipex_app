import { AccountingSetupPermissionKeys, PermissionKeys } from '@/shared/permissions/constants';
import type { AuthUser } from '@/stores/auth-store';
import type { SetupAccess } from '../types/accounting-setup.types';

function buildScopeAccess(params: {
  canReadSetup: boolean;
  canCreateSetup: boolean;
  canUpdateSetup: boolean;
  canDeleteSetup: boolean;
  permissions: Set<string>;
  scope: (typeof AccountingSetupPermissionKeys)[keyof typeof AccountingSetupPermissionKeys];
}): SetupAccess {
  return {
    canRead:
      params.canReadSetup ||
      params.canCreateSetup ||
      params.canUpdateSetup ||
      params.canDeleteSetup ||
      params.permissions.has(params.scope.read) ||
      params.permissions.has(params.scope.create) ||
      params.permissions.has(params.scope.update) ||
      params.permissions.has(params.scope.delete),
    canCreate: params.canCreateSetup || params.permissions.has(params.scope.create),
    canUpdate: params.canUpdateSetup || params.permissions.has(params.scope.update),
    canDelete: params.canDeleteSetup || params.permissions.has(params.scope.delete),
  };
}

export function useAccountingSetupAccess(user: AuthUser | null | undefined) {
  const permissions = new Set(user?.permissions ?? []);

  const hasLegacySetupAccess =
    permissions.has(PermissionKeys.CanReadAccountingSetup) ||
    permissions.has(PermissionKeys.CanCreateAccountingSetup) ||
    permissions.has(PermissionKeys.CanUpdateAccountingSetup) ||
    permissions.has(PermissionKeys.CanDeleteAccountingSetup);

  const hasAnyGranularSetupAccess = Object.values(AccountingSetupPermissionKeys).some((scope) =>
    [scope.read, scope.create, scope.update, scope.delete].some((key) => permissions.has(key)),
  );

  const canCreateSetup = permissions.has(PermissionKeys.CanCreateAccountingSetup);
  const canUpdateSetup = permissions.has(PermissionKeys.CanUpdateAccountingSetup);
  const canDeleteSetup = permissions.has(PermissionKeys.CanDeleteAccountingSetup);
  const canReadSetup = permissions.has(PermissionKeys.CanReadAccountingSetup);

  const accountsAccess = buildScopeAccess({
    canReadSetup,
    canCreateSetup,
    canUpdateSetup,
    canDeleteSetup,
    permissions,
    scope: AccountingSetupPermissionKeys.accounts,
  });
  const categoriesAccess = buildScopeAccess({
    canReadSetup,
    canCreateSetup,
    canUpdateSetup,
    canDeleteSetup,
    permissions,
    scope: AccountingSetupPermissionKeys.categories,
  });
  const policiesAccess = buildScopeAccess({
    canReadSetup,
    canCreateSetup,
    canUpdateSetup,
    canDeleteSetup,
    permissions,
    scope: AccountingSetupPermissionKeys.policies,
  });
  const bankAccountsAccess = buildScopeAccess({
    canReadSetup,
    canCreateSetup,
    canUpdateSetup,
    canDeleteSetup,
    permissions,
    scope: AccountingSetupPermissionKeys.bankAccounts,
  });
  const taxProfilesAccess = buildScopeAccess({
    canReadSetup,
    canCreateSetup,
    canUpdateSetup,
    canDeleteSetup,
    permissions,
    scope: AccountingSetupPermissionKeys.taxProfiles,
  });
  const taxComponentsAccess = buildScopeAccess({
    canReadSetup,
    canCreateSetup,
    canUpdateSetup,
    canDeleteSetup,
    permissions,
    scope: AccountingSetupPermissionKeys.taxComponents,
  });

  return {
    canAccessSetup: hasLegacySetupAccess || hasAnyGranularSetupAccess,
    accountsAccess,
    categoriesAccess,
    policiesAccess,
    bankAccountsAccess,
    taxProfilesAccess,
    taxComponentsAccess,
  };
}
