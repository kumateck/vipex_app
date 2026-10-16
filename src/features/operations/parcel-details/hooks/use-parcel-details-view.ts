import { useMemo } from 'react';
import { useListBranchOptionsQuery } from '@/features/branches/api/branches.api';
import { useGetParcelDetailsQuery } from '@/features/operations/parcel/api/parcel.api';
import { useAuthStore } from '@/stores/auth-store';
import { useGetParcelHistoryQuery } from '../services/parcel-history.api';

/** Loads everything the shared parcel details view shows for one parcel. */
export function useParcelDetailsView(parcelId: string | null) {
  const companyId = useAuthStore((state) => state.user?.company?.id ?? null);
  const skip = !parcelId;
  const detailsQuery = useGetParcelDetailsQuery(parcelId ?? '', { skip });
  const historyQuery = useGetParcelHistoryQuery(parcelId ?? '', { skip });
  const { data: branchOptions = [] } = useListBranchOptionsQuery(
    { companyId },
    { skip: skip || !companyId },
  );
  const branchNameById = useMemo(
    () => new Map(branchOptions.map((branch) => [branch.id, branch.name])),
    [branchOptions],
  );
  // A different parcel's cached data must not flash while the new one loads.
  const details = detailsQuery.data?.parcel.id === parcelId ? detailsQuery.data : undefined;

  return {
    details,
    isLoading: !details && !detailsQuery.isError,
    isError: detailsQuery.isError,
    retry: detailsQuery.refetch,
    history: historyQuery.data?.events ?? [],
    isHistoryLoading: historyQuery.isFetching && !historyQuery.data,
    isHistoryError: historyQuery.isError,
    branchNameById,
  };
}

export type ParcelDetailsView = ReturnType<typeof useParcelDetailsView>;
