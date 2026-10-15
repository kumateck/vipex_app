import { useAuthStore } from '@/stores/auth-store';
import { useListParcelChargeAgentsQuery } from '../services';
import type { ParcelChargeAgentSource } from '../types';

export function useParcelChargeAgentOptions(source: ParcelChargeAgentSource = 'booking') {
  const companyId = useAuthStore((state) => state.user?.company?.id ?? '');
  const branchId = useAuthStore((state) => state.user?.branch?.id ?? '');
  return useListParcelChargeAgentsQuery(
    { source, companyId, branchId },
    { skip: !companyId || !branchId, refetchOnMountOrArgChange: true },
  );
}
