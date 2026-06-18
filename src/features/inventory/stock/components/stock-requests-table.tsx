import { useCallback, useMemo, useState } from 'react';
import { InventoryLocationType } from '@/db/schemas/enums';
import { DataTable } from '@/components/datatable';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  const [query, setQuery] = useState<StockRequestListQuery>({
    page: 1,
    pageSize: 20,
    filters: serverFilters,
  });

  const { data, isLoading } = useListStockRequestsQuery(query, {
    skip: !companyId || !branchId,
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

  const handleRequestChange = useCallback(
    (request: StockRequestListQuery) => {
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
        searchPlaceholder="Search stock requests..."
        enableVirtualization={false}
      />
    </div>
  );
}
