import {
  dashboardPathForDomain,
  resolvePrimaryDomain,
} from '@/features/dashboard/domain-dashboard';
import { useAuthStore } from '@/stores/auth-store';
import { Navigate } from 'react-router-dom';

const DashboardHomePage = () => {
  const user = useAuthStore((state) => state.user);
  const domain = resolvePrimaryDomain(user);
  return <Navigate to={dashboardPathForDomain(domain)} replace />;
};

export default DashboardHomePage;
