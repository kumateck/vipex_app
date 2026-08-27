import { canViewDashboard, resolveMobileDashboardKind } from '@mobile/lib/permissions';
import { useAuth } from '@mobile/providers/auth-provider';
import { AppScreen } from '@mobile/components/screen';
import { MobileNoAccess } from '@mobile/components/ui';
import { CashierDashboard } from '../cashier-dashboard';
import { RiderDashboard } from '../rider-dashboard';
import { StandardDashboard } from '../standard-dashboard';

export function DashboardScreen() {
  const { session } = useAuth();
  const user = session.user;
  const dashboardKind = resolveMobileDashboardKind(user?.userType);

  if (!canViewDashboard(user?.permissions)) {
    return (
      <AppScreen scrollable={false}>
        <MobileNoAccess message="You do not have permission to view the dashboard." />
      </AppScreen>
    );
  }

  if (dashboardKind === 'cashier') return <CashierDashboard />;
  if (dashboardKind === 'rider') return <RiderDashboard />;
  return <StandardDashboard />;
}
