import { getErrorMessage as getApplicationErrorMessage } from '@/lib/TheAduseiErrorResponse';
import { useCallback } from 'react';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth-store';
import { useListCompanyModulesQuery, useSetCompanyModuleStateMutation } from '../api';

export function useCompanyModuleSettings() {
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);
  const { data: modules = [], isFetching, refetch } = useListCompanyModulesQuery();
  const [setCompanyModuleState, { isLoading: isSaving }] = useSetCompanyModuleStateMutation();

  const handleToggle = useCallback(
    async (moduleCode: string, isEnabled: boolean) => {
      try {
        await setCompanyModuleState({ moduleCode, isEnabled }).unwrap();
        if (moduleCode === 'accounting' && user?.company) {
          updateUser({ company: { ...user.company, useAccounting: isEnabled } });
        }
        toast.success(`${moduleCode} ${isEnabled ? 'enabled' : 'disabled'}`);
        await refetch();
      } catch (error) {
        toast.error(getApplicationErrorMessage(error, '') || 'Failed to update company module');
      }
    },
    [refetch, setCompanyModuleState, updateUser, user?.company],
  );

  return {
    modules,
    isFetching,
    isSaving,
    handleToggle,
  };
}
