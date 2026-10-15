import { useAuthStore } from '@/stores/auth-store';
import { useListLocationOptionsQuery } from '../api/locations.api';

export function useReceivingLocationOptions(branchId: string, enabled = true) {
  const companyId = useAuthStore((state) => state.user?.company?.id);
  return useListLocationOptionsQuery(
    { companyId, branchId, canReceive: true },
    { skip: !enabled || !companyId || !branchId },
  );
}
