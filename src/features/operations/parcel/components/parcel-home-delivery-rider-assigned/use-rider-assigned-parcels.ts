import { useMemo, useState } from 'react';
import { useListUserOptionsQuery } from '@/features/users/api/users.api';
import { useAuthStore } from '@/stores/auth-store';
import { useListRiderDoorstepParcelsQuery } from '../../api/parcel.api';

export type RiderListMode = 'current' | 'history' | 'all';

export function useRiderAssignedParcels() {
  const user = useAuthStore((state) => state.user);
  const companyId = user?.company?.id ?? null;
  const branchId = user?.branch?.id ?? null;
  const [selectedRiderUserId, setSelectedRiderUserId] = useState('');
  const [mode, setMode] = useState<RiderListMode>('all');

  const { data: riderOptions = [] } = useListUserOptionsQuery(
    companyId && branchId ? { companyId, branchId, userType: 2 } : undefined,
    { skip: !companyId || !branchId },
  );
  const { currentData, isFetching: loadingCurrent } = useListRiderDoorstepParcelsQuery(
    { riderUserId: selectedRiderUserId, mode: 'current' },
    { skip: !selectedRiderUserId || mode === 'history' },
  );
  const { currentData: historyData, isFetching: loadingHistory } = useListRiderDoorstepParcelsQuery(
    { riderUserId: selectedRiderUserId, mode: 'history' },
    { skip: !selectedRiderUserId || mode === 'current' },
  );

  const rows = useMemo(() => {
    if (mode === 'current') return currentData?.rows ?? [];
    if (mode === 'history') return historyData?.rows ?? [];
    return [...(currentData?.rows ?? []), ...(historyData?.rows ?? [])];
  }, [currentData?.rows, historyData?.rows, mode]);
  const isLoading =
    mode === 'all'
      ? loadingCurrent || loadingHistory
      : mode === 'current'
        ? loadingCurrent
        : loadingHistory;
  const selectedRiderName = riderOptions.find(
    (rider) => rider.id === selectedRiderUserId,
  )?.fullname;
  const isReady =
    mode === 'all'
      ? Boolean(currentData && historyData)
      : mode === 'current'
        ? Boolean(currentData)
        : Boolean(historyData);

  return {
    rows,
    isLoading,
    isReady,
    riderOptions,
    selectedRiderName,
    selectedRiderUserId,
    setSelectedRiderUserId,
    mode,
    setMode,
  };
}
