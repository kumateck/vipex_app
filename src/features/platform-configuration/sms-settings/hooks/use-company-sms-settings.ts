import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { PermissionKeys } from '@/shared/permissions/constants';
import { useAuthStore } from '@/stores/auth-store';
import {
  useGetCompanySmsSettingsQuery,
  useGetSmsProviderBalanceQuery,
  useSetCompanyDefaultSmsProviderMutation,
} from '../services';

const PROVIDERS_WITH_BALANCE = new Set(['mnotify']);

export function useCompanySmsSettings() {
  const permissions = useAuthStore((state) => state.user?.permissions ?? []);
  const canManageCompanySettings = permissions.includes(PermissionKeys.CanManageCompanyModules);
  const canManageProviders =
    canManageCompanySettings || permissions.includes(PermissionKeys.CanManageNotificationProviders);
  const canManageTemplates =
    canManageCompanySettings || permissions.includes(PermissionKeys.CanManageNotificationTemplates);
  const canCreateBulkSms =
    canManageCompanySettings || permissions.includes(PermissionKeys.CanCreateNotificationCampaigns);
  const query = useGetCompanySmsSettingsQuery();
  const [setDefaultProvider, { isLoading: isSavingProvider }] =
    useSetCompanyDefaultSmsProviderMutation();
  const [draftProviderKey, setDraftProviderKey] = useState<string | null>(null);
  const selectedProviderKey = draftProviderKey ?? query.data?.defaultProviderKey ?? '';
  const balanceQuery = useGetSmsProviderBalanceQuery(selectedProviderKey, {
    skip: !PROVIDERS_WITH_BALANCE.has(selectedProviderKey.toLowerCase()),
  });

  const saveDefaultProvider = useCallback(async () => {
    if (!selectedProviderKey) return;
    try {
      await setDefaultProvider({ providerKey: selectedProviderKey }).unwrap();
      await query.refetch();
      setDraftProviderKey(null);
      toast.success('Default SMS provider updated for this company');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update SMS provider');
    }
  }, [query, selectedProviderKey, setDefaultProvider]);

  return {
    ...query,
    canManageProviders,
    canManageTemplates,
    canCreateBulkSms,
    isSavingProvider,
    selectedProviderKey,
    setSelectedProviderKey: setDraftProviderKey,
    providerBalance: balanceQuery.data,
    isLoadingProviderBalance: balanceQuery.isFetching,
    providerBalanceError: balanceQuery.error,
    isProviderDirty:
      Boolean(draftProviderKey) && draftProviderKey !== query.data?.defaultProviderKey,
    saveDefaultProvider,
  };
}
