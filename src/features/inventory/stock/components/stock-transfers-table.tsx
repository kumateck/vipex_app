import { useCallback, useMemo, useState } from 'react';
import { DataTable } from '@/components/datatable';
import type { PaginationMeta } from '@/server/types/pagination.types';
import { useAuthStore } from '@/stores/auth-store';
import { useListInventoryLocationOptionsQuery } from '@/features/inventory/locations/api/inventory-locations.api';
import { useListInventoryProductsQuery } from '@/features/inventory/products/api/inventory-products.api';
import { useListStockTransfersQuery } from '@/features/inventory/api';
import { createStockTransferColumns } from './stock-transfer-columns';
import type { StockTransferListQuery } from '../types/inventory-stock.types';

const EMPTY_META: PaginationMeta = {
  totalRecords: 0,
  totalPages: 1,
  page: 1,
  pageSize: 20,
  hasNextPage: false,
  hasPreviousPage: false,
};

export function StockTransfersTable() {
  const companyId = useAuthStore((state) => state.user?.company?.id ?? null);
  const serverFilters = useMemo(() => ({ companyId }), [companyId]);
  const [query, setQuery] = useState<StockTransferListQuery>({
    page: 1,
    pageSize: 20,
    filters: serverFilters,
  });

  const { data, isLoading } = useListStockTransfersQuery(query, {
    skip: !companyId,
  });

  const { data: productsData } = useListInventoryProductsQuery(
    {
      page: 1,
      pageSize: 500,
      filters: { companyId },
    },
    { skip: !companyId },
  );
  const { data: locationsData = [] } = useListInventoryLocationOptionsQuery(
    { companyId },
    { skip: !companyId },
  );

  const productNameById = useMemo(
    () => new Map((productsData?.data ?? []).map((product) => [product.id, product.name] as const)),
    [productsData],
  );
  const productConversionsById = useMemo(
    () =>
      new Map(
        (productsData?.data ?? []).map(
          (product) => [product.id, product.unitConversions ?? []] as const,
        ),
      ),
    [productsData],
  );
  const locationNameById = useMemo(
    () => new Map(locationsData.map((location) => [location.id, location.name] as const)),
    [locationsData],
  );

  const columns = useMemo(
    () => createStockTransferColumns(productNameById, locationNameById, productConversionsById),
    [productNameById, locationNameById, productConversionsById],
  );

  const handleRequestChange = useCallback((request: StockTransferListQuery) => {
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
      searchPlaceholder="Search stock transfers..."
      enableVirtualization={false}
    />
  );
}
