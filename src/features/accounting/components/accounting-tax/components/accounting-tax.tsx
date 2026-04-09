import { PermissionKeys } from '@/shared/permissions/constants';
import { useAuthStore } from '@/stores/auth-store';
import { AccountingDisabledState, AccountingUnauthorizedState } from '../../accounting-shared';
import { AccountingTaxContent } from './accounting-tax-content';

export function AccountingTax() {
  const user = useAuthStore((state) => state.user);
  const permissions = new Set(user?.permissions ?? []);
  const canAccessTaxFiling =
    permissions.has(PermissionKeys.CanCreateTaxFilingPeriod) ||
    permissions.has(PermissionKeys.CanMarkTaxFilingPeriodUnderReview) ||
    permissions.has(PermissionKeys.CanSubmitTaxFilingPeriod) ||
    permissions.has(PermissionKeys.CanCloseTaxFilingPeriod) ||
    permissions.has(PermissionKeys.CanMarkTaxItemReadyForFiling) ||
    permissions.has(PermissionKeys.CanMarkTaxItemFiled) ||
    permissions.has(PermissionKeys.CanExcludeTaxItemFromFiling);

  if (!user?.company?.useAccounting) {
    return <AccountingDisabledState />;
  }

  if (!canAccessTaxFiling) {
    return (
      <AccountingUnauthorizedState
        title="Tax Filing Restricted"
        description="Your role does not include permission to manage tax filing actions."
      />
    );
  }

  return <AccountingTaxContent user={user} />;
}
