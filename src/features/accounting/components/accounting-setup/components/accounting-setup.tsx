import { useAuthStore } from '@/stores/auth-store';
import { AccountingDisabledState, AccountingUnauthorizedState } from '../../accounting-shared';
import { useAccountingSetupAccess } from '../hooks/use-accounting-setup-access';
import { AccountingSetupContent } from './accounting-setup-content';

export function AccountingSetup() {
  const user = useAuthStore((state) => state.user);
  const access = useAccountingSetupAccess(user);

  if (!user?.company?.useAccounting) {
    return <AccountingDisabledState />;
  }

  if (!access.canAccessSetup) {
    return (
      <AccountingUnauthorizedState
        title="Accounting Setup Restricted"
        description="Your role does not include permission to view or manage accounting setup masters."
      />
    );
  }

  return <AccountingSetupContent user={user} access={access} />;
}
