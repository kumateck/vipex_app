import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PermissionKeys } from '@/shared/permissions/constants';
import { useAuthStore } from '@/stores/auth-store';
import { useListReturnToSourceParcelsQuery } from '../api/parcel.api';

export function useReturnToSourceList() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedParcelId, setSelectedParcelId] = useState<string | null>(null);
  const { data, isFetching } = useListReturnToSourceParcelsQuery(
    { page, pageSize: 20, search: search || undefined },
    { skip: !user?.company?.id || !user?.branch?.id },
  );
  const rows = data?.data ?? [];
  const selectedParcelRow = rows.find((row) => row.id === selectedParcelId);
  const branchNameById = useMemo(() => {
    const names = new Map<string, string>();
    for (const row of rows) {
      if (row.sourceName) names.set(row.sourceId, row.sourceName);
      if (row.destinationName) names.set(row.destinationId, row.destinationName);
    }
    return names;
  }, [rows]);
  const permissions = user?.permissions ?? [];

  return {
    rows,
    meta: data?.meta,
    isFetching,
    page,
    searchInput,
    setSearchInput,
    submitSearch: () => {
      setSearch(searchInput.trim());
      setPage(1);
    },
    setPage,
    selectedParcelId,
    selectedParcelRow,
    setSelectedParcelId,
    branchNameById,
    companyId: user?.company?.id ?? null,
    canCreateShipment: permissions.includes(PermissionKeys.CanCreateBookingWithParcels),
    canManageReconciliation: permissions.includes(PermissionKeys.CanReadParcelReconciliation),
    startShipment: () => navigate('/parcels/create'),
    manageReconciliation: (bookingCode: string) =>
      navigate(`/parcels/reconciliation-cases?search=${encodeURIComponent(bookingCode)}`),
  };
}
