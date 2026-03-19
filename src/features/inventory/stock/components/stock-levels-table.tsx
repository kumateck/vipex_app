import { useCallback, useMemo, useState } from 'react';
import { DataTable } from '@/components/datatable';
import type { PaginationMeta } from '@/server/types/pagination.types';
import { useAuthStore } from '@/stores/auth-store';
import { useListInventoryLocationsQuery } from '@/features/inventory/locations/api/inventory-locations.api';
import { useListInventoryProductsQuery } from '@/features/inventory/products/api/inventory-products.api';
import { useListStockLevelsQuery } from '@/features/inventory/api';
import { createStockLevelColumns } from './stock-level-columns';
import type { StockLevelListQuery } from '../types/inventory-stock.types';

const EMPTY_META: PaginationMeta = {
  totalRecords: 0,
  totalPages: 1,
  page: 1,
  pageSize: 20,
  hasNextPage: false,
  hasPreviousPage: false,
};

const OPTIONS_PAGE_SIZE = 100;

export function StockLevelsTable() {
  const companyId = useAuthStore((state) => state.user?.company?.id ?? null);
  const serverFilters = useMemo(() => ({ companyId }), [companyId]);
  const [query, setQuery] = useState<StockLevelListQuery>({
    page: 1,
    pageSize: 20,
    filters: serverFilters,
  });

  const { data, isLoading } = useListStockLevelsQuery(query, {
    skip: !companyId,
  });

  const productQuery = useMemo(
    () => ({ page: 1, pageSize: OPTIONS_PAGE_SIZE, filters: { companyId } }),
    [companyId],
  );
  const locationQuery = useMemo(
    () => ({ page: 1, pageSize: OPTIONS_PAGE_SIZE, filters: { companyId } }),
    [companyId],
  );

  const { data: productsData } = useListInventoryProductsQuery(productQuery, { skip: !companyId });
  const { data: locationsData } = useListInventoryLocationsQuery(locationQuery, { skip: !companyId });

  const productNameById = useMemo(
    () => new Map((productsData?.data ?? []).map((product) => [product.id, product.name] as const)),
    [productsData],
  );
  const locationNameById = useMemo(
    () => new Map((locationsData?.data ?? []).map((location) => [location.id, location.name] as const)),
    [locationsData],
  );

  const columns = useMemo(
    () => createStockLevelColumns(productNameById, locationNameById),
    [productNameById, locationNameById],
  );

  const handleRequestChange = useCallback((request: StockLevelListQuery) => {
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
      searchPlaceholder="Search stock levels..."
      enableVirtualization={false}
    />
  );
}
