import { useCallback, useMemo, useState } from 'react';
import { DataTable } from '@/components/datatable';
import type { PaginationMeta } from '@/server/types/pagination.types';
import { useAuthStore } from '@/stores/auth-store';
import { useListStockMaintenanceRecordsQuery } from '@/features/inventory/api';
import { useListInventoryLocationOptionsQuery } from '@/features/inventory/locations/api/inventory-locations.api';
import { useListInventoryProductsQuery } from '@/features/inventory/products/api/inventory-products.api';
import { createStockMaintenanceColumns } from './stock-maintenance-columns';
import type { StockMaintenanceListQuery } from '../types/inventory-stock.types';

const EMPTY_META: PaginationMeta = {
  totalRecords: 0,
  totalPages: 1,
  page: 1,
  pageSize: 20,
  hasNextPage: false,
  hasPreviousPage: false,
};

export function StockMaintenanceTable() {
  const companyId = useAuthStore((state) => state.user?.company?.id ?? null);
  const serverFilters = useMemo(() => ({ companyId }), [companyId]);
  const [query, setQuery] = useState<StockMaintenanceListQuery>({
    page: 1,
    pageSize: 20,
    filters: serverFilters,
  });

  const { data, isLoading } = useListStockMaintenanceRecordsQuery(query, { skip: !companyId });
  const { data: locations = [] } = useListInventoryLocationOptionsQuery(
    { companyId },
    { skip: !companyId },
  );
  const { data: productsData } = useListInventoryProductsQuery(
    { page: 1, pageSize: 500, filters: { companyId } },
    { skip: !companyId },
  );

  const productNameById = useMemo(
    () => new Map((productsData?.data ?? []).map((row) => [row.id, row.name] as const)),
    [productsData],
  );
  const locationNameById = useMemo(
    () => new Map(locations.map((row) => [row.id, row.name] as const)),
    [locations],
  );
  const columns = useMemo(
    () => createStockMaintenanceColumns(productNameById, locationNameById),
    [locationNameById, productNameById],
  );

  const handleRequestChange = useCallback((request: StockMaintenanceListQuery) => {
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
      searchPlaceholder="Search stock maintenance..."
      enableVirtualization={false}
    />
  );
}
