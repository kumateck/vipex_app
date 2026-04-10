import { useAuthStore } from '@/stores/auth-store';
import {
  dashboardPathForDomain,
  resolvePrimaryDomain,
} from '@/features/dashboard/domain-dashboard';
import { Navigate } from 'react-router-dom';

export default function IndexRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);

  // If user lands on "/", send them where they belong:
  if (isAuthenticated)
    return <Navigate to={dashboardPathForDomain(resolvePrimaryDomain(user))} replace />;

  // If unauthenticated, go to login. Preserve where they came from.
  return <Navigate to="/login" replace />;
}
