import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { useAuthStore } from '@/stores/auth-store';

type PermissionInput = string | string[];

function normalizePermissions(permissionKey: PermissionInput): string[] {
  return Array.isArray(permissionKey) ? permissionKey : [permissionKey];
}

export function useHasPermission(permissionKey: PermissionInput, mode: 'all' | 'any' = 'all') {
  const storePermissions = useAuthStore((state) => state.user?.permissions ?? []);

  return useMemo(() => {
    const required = normalizePermissions(permissionKey);
    if (required.length === 0) return true;
    const granted = new Set(storePermissions);
    if (mode === 'any') return required.some((key) => granted.has(key));
    return required.every((key) => granted.has(key));
  }, [mode, permissionKey, storePermissions]);
}

export function PermissionGuard({
  permissionKey,
  mode = 'all',
  fallback = null,
  children,
}: {
  permissionKey: PermissionInput;
  mode?: 'all' | 'any';
  fallback?: ReactNode;
  children: ReactNode;
}) {
  const hasPermission = useHasPermission(permissionKey, mode);
  if (!hasPermission) return <>{fallback}</>;
  return <>{children}</>;
}
