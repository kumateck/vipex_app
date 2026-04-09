import { PermissionKeys } from '@/shared/permissions/constants';
import { useAuthStore } from '@/stores/auth-store';
import { AccountingDisabledState, AccountingUnauthorizedState } from '../../accounting-shared';
import type { ExpensesPageView } from '../types/accounting-expenses.types';
import { AccountingExpensesContent } from './accounting-expenses-content';

export function AccountingExpenses({ view = 'main' }: { view?: ExpensesPageView }) {
  const user = useAuthStore((state) => state.user);
  const permissions = new Set(user?.permissions ?? []);
  const canAccessExpenses =
    permissions.has(PermissionKeys.CanReadAccounting) ||
    permissions.has(PermissionKeys.CanCreateExpenseRequest) ||
    permissions.has(PermissionKeys.CanSubmitExpenseRequest) ||
    permissions.has(PermissionKeys.CanApproveExpenseRequest) ||
    permissions.has(PermissionKeys.CanRejectExpenseRequest) ||
    permissions.has(PermissionKeys.CanPayExpenseRequest) ||
    permissions.has(PermissionKeys.CanPostExpenseRequest);

  if (!user?.company?.useAccounting) {
    return <AccountingDisabledState />;
  }

  if (!canAccessExpenses) {
    return (
      <AccountingUnauthorizedState
        title="Expense Workflow Restricted"
        description="Your role does not include permission to process expense workflow actions."
      />
    );
  }

  return <AccountingExpensesContent user={user} view={view} />;
}
