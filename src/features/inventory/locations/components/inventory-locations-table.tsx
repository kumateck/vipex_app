import { useCallback, useMemo, useState } from 'react';
import { DataTable } from '@/components/datatable';
import type { PaginationMeta } from '@/server/types/pagination.types';
import { useAuthStore } from '@/stores/auth-store';
import { useListBranchOptionsQuery } from '@/features/branches';
import { useListInventoryLocationsQuery } from '../api/inventory-locations.api';
import { createInventoryLocationColumns } from './inventory-location-columns';
import type { InventoryLocationListQuery } from '../types/inventory-location.types';

const EMPTY_META: PaginationMeta = {
  totalRecords: 0,
  totalPages: 1,
  page: 1,
  pageSize: 20,
  hasNextPage: false,
  hasPreviousPage: false,
};

export function InventoryLocationsTable() {
  const companyId = useAuthStore((state) => state.user?.company?.id ?? null);
  const serverFilters = useMemo(() => ({ companyId }), [companyId]);
  const [query, setQuery] = useState<InventoryLocationListQuery>({
    page: 1,
    pageSize: 20,
    filters: serverFilters,
  });

  const { data: locationsData, isLoading: isLoadingLocations } = useListInventoryLocationsQuery(query, {
    skip: !companyId,
  });
  const { data: branchesData } = useListBranchOptionsQuery({ companyId }, { skip: !companyId });

  const branchNameById = useMemo(
    () => new Map((branchesData ?? []).map((branch) => [branch.id, branch.name] as const)),
    [branchesData],
  );
  const columns = useMemo(() => createInventoryLocationColumns(branchNameById), [branchNameById]);
  const rows = useMemo(() => locationsData?.data ?? [], [locationsData]);

  const handleRequestChange = useCallback((request: InventoryLocationListQuery) => {
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
      searchPlaceholder="Search inventory locations..."
      enableVirtualization={false}
    />
  );
}
