import type { ComponentType } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { Navigate, useLocation } from 'react-router-dom';

export function withProtection<P extends object>(Wrapped: ComponentType<P>) {
  function WithProtection(props: P) {
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    const location = useLocation();

    if (!isAuthenticated) {
      return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <Wrapped {...props} />;
  }

  WithProtection.displayName = `withProtection(${Wrapped.displayName ?? Wrapped.name ?? 'Component'})`;
  return WithProtection;
}
