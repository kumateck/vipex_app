import { useCallback, useMemo, useState } from 'react';
import { DataTable } from '@/components/datatable';
import type { PaginationMeta } from '@/server/types/pagination.types';
import { useAuthStore } from '@/stores/auth-store';
import { useListInventoryLocationOptionsQuery } from '@/features/inventory/locations/api/inventory-locations.api';
import { useListInventoryProductOptionsQuery } from '@/features/inventory/products/api/inventory-products.api';
import { useListStockAdjustmentsQuery } from '@/features/inventory/api';
import { createStockAdjustmentColumns } from './stock-adjustment-columns';
import type { StockAdjustmentListQuery } from '../types/inventory-stock.types';

const EMPTY_META: PaginationMeta = {
  totalRecords: 0,
  totalPages: 1,
  page: 1,
  pageSize: 20,
  hasNextPage: false,
  hasPreviousPage: false,
};

export function StockAdjustmentsTable() {
  const companyId = useAuthStore((state) => state.user?.company?.id ?? null);
  const serverFilters = useMemo(() => ({ companyId }), [companyId]);
  const [query, setQuery] = useState<StockAdjustmentListQuery>({
    page: 1,
    pageSize: 20,
    filters: serverFilters,
  });

  const { data, isLoading } = useListStockAdjustmentsQuery(query, {
    skip: !companyId,
  });

  const { data: productsData = [] } = useListInventoryProductOptionsQuery(
    { companyId },
    { skip: !companyId },
  );
  const { data: locationsData = [] } = useListInventoryLocationOptionsQuery(
    { companyId },
    { skip: !companyId },
  );

  const productNameById = useMemo(
    () => new Map(productsData.map((product) => [product.id, product.name] as const)),
    [productsData],
  );
  const locationNameById = useMemo(
    () => new Map(locationsData.map((location) => [location.id, location.name] as const)),
    [locationsData],
  );

  const columns = useMemo(
    () => createStockAdjustmentColumns(productNameById, locationNameById),
    [productNameById, locationNameById],
  );

  const handleRequestChange = useCallback((request: StockAdjustmentListQuery) => {
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
      searchPlaceholder="Search stock adjustments..."
      enableVirtualization={false}
    />
  );
}
