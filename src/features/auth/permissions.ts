import { useAuthStore } from '@/stores/auth-store';

export function hasPermission(permission: string): boolean {
  const permissions = useAuthStore.getState().user?.permissions ?? [];
  return permissions.includes(permission);
}

export function hasAllPermissions(required: string[]): boolean {
  const permissions = new Set(useAuthStore.getState().user?.permissions ?? []);
  return required.every((permission) => permissions.has(permission));
}
