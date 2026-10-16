import { PermissionKeys } from '@/shared/permissions/constants';
import { useAuthStore } from '@/stores/auth-store';
import { useGetWhatsAppSettingsQuery } from '../services';

export function useWhatsAppSettings() {
  const permissions = useAuthStore((state) => state.user?.permissions ?? []);
  const canManageCompany = permissions.includes(PermissionKeys.CanManageCompanyModules);
  const query = useGetWhatsAppSettingsQuery();
  return {
    ...query,
    canManageProvider:
      canManageCompany || permissions.includes(PermissionKeys.CanManageNotificationProviders),
    canManageTemplates:
      canManageCompany || permissions.includes(PermissionKeys.CanManageNotificationTemplates),
  };
}
