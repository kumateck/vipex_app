import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { InventoryLocationType } from '@/db/schemas/enums';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { useAuthStore } from '@/stores/auth-store';
import { useListStockLotsQuery } from '@/features/inventory/api';
import { useListInventoryProductOptionsQuery } from '@/features/inventory/products/api/inventory-products.api';
import { useListInventoryLocationOptionsQuery } from '@/features/inventory/locations/api/inventory-locations.api';

function stockLotStatusLabel(status: number) {
  if (status === 0) return 'Active';
  if (status === 1) return 'Expired';
  if (status === 2) return 'Quarantined';
  if (status === 3) return 'Depleted';
  return 'Unknown';
}

export function StockLotsListPage() {
  const companyId = useAuthStore((state) => state.user?.company?.id ?? null);
  const branchId = useAuthStore((state) => state.user?.branch?.id ?? null);
  const [locationTypeTab, setLocationTypeTab] = useState<'all' | 'main' | 'branch' | 'consumption'>(
    'all',
  );
  const [page, setPage] = useState(1);
  const selectedLocationType = useMemo(() => {
    if (locationTypeTab === 'main') return InventoryLocationType.MAIN_STORE;
    if (locationTypeTab === 'branch') return InventoryLocationType.BRANCH_STORE;
    if (locationTypeTab === 'consumption') return InventoryLocationType.CONSUMPTION_LOCATION;
    return null;
  }, [locationTypeTab]);

  const query = useMemo(
    () => ({
      page,
      pageSize: 20,
      filters: {
        companyId: companyId ?? '',
        branchId: branchId ?? undefined,
        locationType: selectedLocationType,
      },
    }),
    [branchId, companyId, page, selectedLocationType],
  );

  const { data, isLoading } = useListStockLotsQuery(query, { skip: !companyId || !branchId });
  const { data: products = [] } = useListInventoryProductOptionsQuery(
    { companyId },
    { skip: !companyId },
  );
  const { data: locations = [] } = useListInventoryLocationOptionsQuery(
    { companyId },
    { skip: !companyId },
  );
  const rows = data?.data ?? [];
  const meta = data?.meta;
  const productNameById = useMemo(
    () => new Map(products.map((product) => [product.id, product.name] as const)),
    [products],
  );
  const locationNameById = useMemo(
    () => new Map(locations.map((location) => [location.id, location.name] as const)),
    [locations],
  );

  return (
    <ScrollableWrapper>
      <div className="w-full p-4 space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Stock Lots</CardTitle>
            <div className="flex gap-2">
              <Button asChild variant="outline">
                <Link to="/inventory/stock-lots/analytics">Lot Analytics</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/inventory/stock-lots/expiry-alerts">Expiry Alerts</Link>
              </Button>
              <Button asChild>
                <Link to="/inventory/stock-lots/new">Create lot</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs
              value={locationTypeTab}
              onValueChange={(value) => {
                setLocationTypeTab(value as 'all' | 'main' | 'branch' | 'consumption');
                setPage(1);
              }}
            >
              <TabsList className="h-auto w-full max-w-xl grid grid-cols-4">
                <TabsTrigger value="all">All Types</TabsTrigger>
                <TabsTrigger value="main">Main Store</TabsTrigger>
                <TabsTrigger value="branch">Branch Store</TabsTrigger>
                <TabsTrigger value="consumption">Consumption</TabsTrigger>
              </TabsList>
            </Tabs>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Batch</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>On hand</TableHead>
                  <TableHead>Reserved</TableHead>
                  <TableHead>Expiry</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8}>Loading lots...</TableCell>
                  </TableRow>
                ) : rows.length ? (
                  rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        <Link className="underline" to={`/inventory/stock-lots/view/${row.id}`}>
                          {row.batchNumber}
                        </Link>
                      </TableCell>
                      <TableCell>{productNameById.get(row.productId) ?? row.productId}</TableCell>
                      <TableCell>
                        {locationNameById.get(row.locationId) ?? row.locationId}
                      </TableCell>
                      <TableCell>{row.quantityOnHand}</TableCell>
                      <TableCell>{row.reservedQuantity}</TableCell>
                      <TableCell>
                        {row.expiryDate ? new Date(row.expiryDate).toLocaleDateString() : 'N/A'}
                      </TableCell>
                      <TableCell>{stockLotStatusLabel(row.status)}</TableCell>
                      <TableCell>
                        <Link
                          className="underline text-xs"
                          to={`/inventory/stock-lots/traceability/${row.id}`}
                        >
                          Traceability
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8}>No lots found.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {meta?.page ?? 1} of {meta?.totalPages ?? 1}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  disabled={(meta?.page ?? 1) <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  disabled={(meta?.page ?? 1) >= (meta?.totalPages ?? 1)}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollableWrapper>
  );
}
