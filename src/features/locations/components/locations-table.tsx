import { useCallback, useMemo, useState } from 'react';
import { DataTable } from '@/components/datatable';
import type { PaginationMeta } from '@/server/types/pagination.types';
import { useAuthStore } from '@/stores/auth-store';
import { useListLocationsQuery } from '../api/locations.api';
import { createLocationColumns } from './location-columns';
import type { LocationListQuery } from '../types/location.types';

const EMPTY_META: PaginationMeta = {
  totalRecords: 0,
  totalPages: 1,
  page: 1,
  pageSize: 20,
  hasNextPage: false,
  hasPreviousPage: false,
};

export function LocationsTable() {
  const companyId = useAuthStore((state) => state.user?.company?.id ?? null);
  const serverFilters = useMemo(() => ({ companyId }), [companyId]);
  const [query, setQuery] = useState<LocationListQuery>({
    page: 1,
    pageSize: 20,
    filters: serverFilters,
  });

  const { data: locationsData, isLoading: isLoadingLocations } = useListLocationsQuery(query, {
    skip: !companyId,
  });

  const columns = useMemo(() => createLocationColumns(), []);
  const rows = useMemo(() => locationsData?.data ?? [], [locationsData]);

  const handleRequestChange = useCallback((request: LocationListQuery) => {
    setQuery(request);
  }, []);

  return (
    <DataTable
      mode="server"
      data={rows}
      columns={columns}
      meta={locationsData?.meta ?? EMPTY_META}
      loading={isLoadingLocations}
      serverFilters={serverFilters}
      onRequestChange={handleRequestChange}
      searchPlaceholder="Search locations..."
      enableVirtualization={false}
    />
  );
}
