import { useAuthStore } from '@/stores/auth-store';
import { Navigate, useLocation } from 'react-router-dom';

export default function IndexRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const location = useLocation();

  // If user lands on "/", send them where they belong:
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  // If unauthenticated, go to login. Preserve where they came from.
  return <Navigate to="/login" state={{ from: location }} replace />;
}
