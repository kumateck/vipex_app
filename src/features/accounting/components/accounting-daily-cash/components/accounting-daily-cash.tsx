import { PermissionKeys } from '@/shared/permissions/constants';
import { useAuthStore } from '@/stores/auth-store';
import { AccountingDisabledState, AccountingUnauthorizedState } from '../../accounting-shared';
import type { DailyCashPageView } from '../types/accounting-daily-cash.types';
import { AccountingDailyCashContent } from './accounting-daily-cash-content';

export function AccountingDailyCash({ view = 'main' }: { view?: DailyCashPageView }) {
  const user = useAuthStore((state) => state.user);
  const permissions = new Set(user?.permissions ?? []);
  const canAccessDailyCash =
    permissions.has(PermissionKeys.CanCreateDailyCashConfirmation) ||
    permissions.has(PermissionKeys.CanConfirmDailyCashConfirmation) ||
    permissions.has(PermissionKeys.CanPostDailyCashConfirmation);

  if (!user?.company?.useAccounting) {
    return <AccountingDisabledState />;
  }

  if (!canAccessDailyCash) {
    return (
      <AccountingUnauthorizedState
        title="Daily Cash Restricted"
        description="Your role does not include permission to create, confirm, or post daily cash entries."
      />
    );
  }

  return <AccountingDailyCashContent user={user} view={view} />;
}
