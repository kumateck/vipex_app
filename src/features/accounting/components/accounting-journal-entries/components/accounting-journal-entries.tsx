import { PermissionKeys } from '@/shared/permissions/constants';
import { useAuthStore } from '@/stores/auth-store';
import { AccountingDisabledState, AccountingUnauthorizedState } from '../../accounting-shared';
import { ManualJournalEntryForm } from './manual-journal-entry-form';

export function AccountingJournalEntries() {
  const user = useAuthStore((state) => state.user);
  const permissions = new Set(user?.permissions ?? []);
  const canRead = permissions.has(PermissionKeys.CanReadAccountingManualEntries);
  const canCreate = permissions.has(PermissionKeys.CanCreateAccountingManualEntries);
  const canApprove = permissions.has(PermissionKeys.CanApproveAccountingManualEntries);

  if (!user?.company?.useAccounting) {
    return <AccountingDisabledState />;
  }

  if (!canRead && !canCreate && !canApprove) {
    return (
      <AccountingUnauthorizedState
        title="Manual Journal Entries Restricted"
        description="Your role does not include permission to create or approve manual journal entries."
      />
    );
  }

  return <ManualJournalEntryForm user={user} canCreate={canCreate} canApprove={canApprove} />;
}
