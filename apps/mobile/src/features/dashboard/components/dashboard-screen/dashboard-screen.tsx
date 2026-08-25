import { UserType } from '@mobile/constants/user-types';
import { canViewRiderScreen } from '@mobile/lib/permissions';
import { useAuth } from '@mobile/providers/auth-provider';
import { CashierDashboard } from '../cashier-dashboard';
import { RiderDashboard } from '../rider-dashboard';
import { StandardDashboard } from '../standard-dashboard';

function normalizedUserType(value?: number | null): number | null {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return Number.parseInt(value, 10);
  return null;
}

export function DashboardScreen() {
  const { session } = useAuth();
  const user = session.user;
  const userType = normalizedUserType(user?.userType);
  const roleName = user?.role?.name?.toLowerCase() ?? '';
  const isCashier =
    userType === UserType.CASHIER || roleName.includes('cashier') || roleName.includes('frontline');
  const isRider =
    userType === UserType.RIDER ||
    roleName.includes('rider') ||
    canViewRiderScreen(user?.permissions);

  if (isCashier) return <CashierDashboard />;
  if (isRider) return <RiderDashboard />;
  return <StandardDashboard />;
}
