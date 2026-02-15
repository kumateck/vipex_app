import { useAuthStore } from '@/stores/auth-store';
import { Navigate } from 'react-router-dom';

export default function IndexRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  // If user lands on "/", send them where they belong:
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  // If unauthenticated, go to login. Preserve where they came from.
  return <Navigate to="/login" replace />;
}
