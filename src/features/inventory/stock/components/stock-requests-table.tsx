import { useCallback, useMemo, useState } from 'react';
import { DataTable } from '@/components/datatable';
import type { PaginationMeta } from '@/server/types/pagination.types';
import { useAuthStore } from '@/stores/auth-store';
import { useListInventoryLocationOptionsQuery } from '@/features/inventory/locations/api/inventory-locations.api';
import { useListStockRequestsQuery } from '@/features/inventory/api';
import { createStockRequestColumns } from './stock-request-columns';
import type { StockRequestListQuery } from '../types/inventory-stock.types';

const EMPTY_META: PaginationMeta = {
  totalRecords: 0,
  totalPages: 1,
  page: 1,
  pageSize: 20,
  hasNextPage: false,
  hasPreviousPage: false,
};

export function StockRequestsTable() {
  const companyId = useAuthStore((state) => state.user?.company?.id ?? null);
  const serverFilters = useMemo(() => ({ companyId }), [companyId]);
  const [query, setQuery] = useState<StockRequestListQuery>({
    page: 1,
    pageSize: 20,
    filters: serverFilters,
  });

  const { data, isLoading } = useListStockRequestsQuery(query, {
    skip: !companyId,
  });

  const { data: locations = [] } = useListInventoryLocationOptionsQuery(
    { companyId },
    { skip: !companyId },
  );

  const locationNameById = useMemo(
    () => new Map(locations.map((location) => [location.id, location.name] as const)),
    [locations],
  );

  const columns = useMemo(() => createStockRequestColumns(locationNameById), [locationNameById]);

  const handleRequestChange = useCallback((request: StockRequestListQuery) => {
    setQuery(request);
  }, []);

  return (
    <DataTable
      mode="server"
      data={data?.data ?? []}
      columns={columns}
      meta={data?.meta ?? EMPTY_META}
      loading={isLoading}
      serverFilters={serverFilters}
      onRequestChange={handleRequestChange}
      searchPlaceholder="Search stock requests..."
      enableVirtualization={false}
    />
  );
}
