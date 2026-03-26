import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth-store';
import {
  dashboardPathForRole,
  resolveDashboardRoleKey,
} from '@/features/dashboard/utils/role-dashboard';

const DashboardHomePage = () => {
  const user = useAuthStore((state) => state.user);
  const roleKey = resolveDashboardRoleKey(user?.role?.name);

  if (roleKey) {
    return <Navigate to={dashboardPathForRole(roleKey)} replace />;
  }

  return <Navigate to="/reports" replace />;
};

export default DashboardHomePage;
