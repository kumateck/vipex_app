import { useCallback, useMemo, useState } from 'react';
import { InventoryLocationType } from '@/db/schemas/enums';
import { DataTable } from '@/components/datatable';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { PaginationMeta } from '@/server/types/pagination.types';
import { useAuthStore } from '@/stores/auth-store';
import { useListStockMaintenanceRecordsQuery } from '@/features/inventory/api';
import { useListInventoryLocationOptionsQuery } from '@/features/inventory/locations/api/inventory-locations.api';
import { useListInventoryProductOptionsQuery } from '@/features/inventory/products/api/inventory-products.api';
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
  const branchId = useAuthStore((state) => state.user?.branch?.id ?? null);
  const [locationTypeTab, setLocationTypeTab] = useState<'all' | 'main' | 'branch' | 'consumption'>(
    'all',
  );
  const selectedLocationType = useMemo(() => {
    if (locationTypeTab === 'main') return InventoryLocationType.MAIN_STORE;
    if (locationTypeTab === 'branch') return InventoryLocationType.BRANCH_STORE;
    if (locationTypeTab === 'consumption') return InventoryLocationType.CONSUMPTION_LOCATION;
    return null;
  }, [locationTypeTab]);
  const serverFilters = useMemo(
    () => ({ companyId, branchId, locationType: selectedLocationType }),
    [branchId, companyId, selectedLocationType],
  );
  const [query, setQuery] = useState<StockMaintenanceListQuery>({
    page: 1,
    pageSize: 20,
    filters: serverFilters,
  });

  const { data, isLoading } = useListStockMaintenanceRecordsQuery(query, {
    skip: !companyId || !branchId,
  });
  const { data: locations = [] } = useListInventoryLocationOptionsQuery(
    { companyId },
    { skip: !companyId },
  );
  const { data: productsData = [] } = useListInventoryProductOptionsQuery(
    { companyId },
    { skip: !companyId },
  );

  const productNameById = useMemo(
    () => new Map(productsData.map((row) => [row.id, row.name] as const)),
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

  const handleRequestChange = useCallback(
    (request: StockMaintenanceListQuery) => {
      setQuery({ ...request, filters: serverFilters });
    },
    [serverFilters],
  );

  const handleTabChange = (value: string) => {
    const nextTab = value as 'all' | 'main' | 'branch' | 'consumption';
    setLocationTypeTab(nextTab);
    setQuery((prev) => ({
      ...prev,
      page: 1,
      filters: {
        ...serverFilters,
        locationType:
          nextTab === 'main'
            ? InventoryLocationType.MAIN_STORE
            : nextTab === 'branch'
              ? InventoryLocationType.BRANCH_STORE
              : nextTab === 'consumption'
                ? InventoryLocationType.CONSUMPTION_LOCATION
                : null,
      },
    }));
  };

  return (
    <div className="space-y-3">
      <Tabs value={locationTypeTab} onValueChange={handleTabChange}>
        <TabsList className="h-auto w-full max-w-xl grid grid-cols-4">
          <TabsTrigger value="all">All Types</TabsTrigger>
          <TabsTrigger value="main">Main Store</TabsTrigger>
          <TabsTrigger value="branch">Branch Store</TabsTrigger>
          <TabsTrigger value="consumption">Consumption</TabsTrigger>
        </TabsList>
      </Tabs>
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
    </div>
  );
}
