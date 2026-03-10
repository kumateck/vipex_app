import { useCallback, useMemo, useState } from 'react';
import { DataTable } from '@/components/datatable';
import type { PaginationMeta } from '@/server/types/pagination.types';
import { useAuthStore } from '@/stores/auth-store';
import {
  useListInventoryProductCategoryOptionsQuery,
  useListInventoryProductsQuery,
} from '../api/inventory-products.api';
import { createInventoryProductColumns } from './inventory-product-columns';
import type { InventoryProductListQuery } from '../types/inventory-product.types';

const EMPTY_META: PaginationMeta = {
  totalRecords: 0,
  totalPages: 1,
  page: 1,
  pageSize: 20,
  hasNextPage: false,
  hasPreviousPage: false,
};

export function InventoryProductsTable() {
  const companyId = useAuthStore((state) => state.user?.company?.id ?? null);
  const serverFilters = useMemo(() => ({ companyId }), [companyId]);
  const [query, setQuery] = useState<InventoryProductListQuery>({
    page: 1,
    pageSize: 20,
    filters: serverFilters,
  });

  const {
    data: productsData,
    isLoading: isLoadingProducts,
    isFetching: isFetchingProducts,
    isUninitialized: isProductsUninitialized,
  } = useListInventoryProductsQuery(query, {
    skip: !companyId,
  });
  const { data: categoryOptions } = useListInventoryProductCategoryOptionsQuery({ companyId }, { skip: !companyId });

  const categoryNameById = useMemo(
    () => new Map((categoryOptions ?? []).map((item) => [item.id, item.name] as const)),
    [categoryOptions],
  );
  const columns = useMemo(() => createInventoryProductColumns(categoryNameById), [categoryNameById]);
  const rows = useMemo(() => productsData?.data ?? [], [productsData]);

  const handleRequestChange = useCallback((request: InventoryProductListQuery) => {
    setQuery(request);
  }, []);

  return (
    <DataTable
      mode="server"
      data={rows}
      columns={columns}
      meta={productsData?.meta ?? EMPTY_META}
      loading={isLoadingProducts || isFetchingProducts || isProductsUninitialized}
      serverFilters={serverFilters}
      onRequestChange={handleRequestChange}
      searchPlaceholder="Search inventory products..."
      enableVirtualization={false}
    />
  );
}
