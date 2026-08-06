import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-searchable';
import { Spinner } from '@/components/ui/spinner';
import { useGetInventoryDashboardSummaryQuery } from '@/features/inventory/api';
import { useListInventoryLocationOptionsQuery } from '@/features/inventory/locations/api/inventory-locations.api';
import { useAuthStore } from '@/stores/auth-store';
import { formatBaseQuantityWithBestUnits } from '@/shared/inventory/quantity-display';
import { stockMaintenanceIssueTypeLabelByValue } from '../../constants/stock-options';

export function InventoryOverviewPage() {
  const companyId = useAuthStore((state) => state.user?.company?.id ?? null);
  const [locationId, setLocationId] = useState<string>('all');

  const { data: locations = [] } = useListInventoryLocationOptionsQuery(
    { companyId },
    { skip: !companyId },
  );

  const summaryQuery = useMemo(
    () =>
      companyId
        ? {
            companyId,
            locationId: locationId === 'all' ? null : locationId,
            lowStockLimit: 15,
          }
        : undefined,
    [companyId, locationId],
  );

  const { data, isLoading } = useGetInventoryDashboardSummaryQuery(summaryQuery, {
    skip: !summaryQuery,
  });

  return (
    <ScrollableWrapper>
      <div className="w-full p-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Inventory Dashboard</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline">
                <Link to="/inventory/stock-lots">Stock Lots</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/inventory/stock-reservations">Stock Reservations</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/inventory/stock-reservations/exceptions">Reservation Exceptions</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/inventory/stock-count-sessions">Stock Count Sessions</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/inventory/stock-allocation-policy">Allocation Policy</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/inventory/monitoring">Monitoring</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/inventory/reorder-suggestions">Reorder Suggestions</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/inventory/approval-requests">Approval Requests</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/inventory/replenishment-proposals">Replenishment Proposals</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/inventory/tasks">Inventory Tasks</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/inventory/valuation">Valuation</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/inventory/audit/journal">Audit Journal</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/inventory/reports/enterprise-kpis">Enterprise KPIs</Link>
              </Button>
            </div>
            <div className="max-w-sm">
              <Select value={locationId} onValueChange={setLocationId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select location scope" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All locations</SelectItem>
                  {locations.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {isLoading ? (
              <Spinner />
            ) : (
              <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-4">
                <Card>
                  <CardContent className="p-4 space-y-1">
                    <p className="text-xs text-muted-foreground">In-scope locations</p>
                    <p className="text-2xl font-semibold">{data?.totals.totalLocations ?? 0}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 space-y-1">
                    <p className="text-xs text-muted-foreground">SKUs with stock</p>
                    <p className="text-2xl font-semibold">{data?.totals.totalSkus ?? 0}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 space-y-1">
                    <p className="text-xs text-muted-foreground">Total quantity (base)</p>
                    <p className="text-2xl font-semibold">{data?.totals.totalQuantity ?? '0'}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 space-y-1">
                    <p className="text-xs text-muted-foreground">Low stock SKUs</p>
                    <p className="text-2xl font-semibold">{data?.totals.lowStockCount ?? 0}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 space-y-1">
                    <p className="text-xs text-muted-foreground">Out of stock SKUs</p>
                    <p className="text-2xl font-semibold">{data?.totals.outOfStockCount ?? 0}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 space-y-1">
                    <p className="text-xs text-muted-foreground">Open maintenance qty</p>
                    <p className="text-2xl font-semibold">
                      {data?.totals.openMaintenanceQty ?? '0'}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 space-y-1">
                    <p className="text-xs text-muted-foreground">Open missing qty</p>
                    <p className="text-2xl font-semibold">{data?.totals.missingQty ?? '0'}</p>
                  </CardContent>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Low Stock Signals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-4">Product</th>
                    <th className="text-left py-2 pr-4">SKU</th>
                    <th className="text-left py-2 pr-4">Current</th>
                    <th className="text-left py-2 pr-4">Min level</th>
                    <th className="text-left py-2 pr-4">Reorder gap</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.lowStockItems ?? []).map((item) => {
                    const gap = Math.max(0, Number(item.minStockLevel) - Number(item.quantity));
                    return (
                      <tr key={item.productId} className="border-b">
                        <td className="py-2 pr-4">{item.productName}</td>
                        <td className="py-2 pr-4">{item.productSku}</td>
                        <td className="py-2 pr-4">
                          {formatBaseQuantityWithBestUnits(item.quantity, undefined)}
                        </td>
                        <td className="py-2 pr-4">
                          {formatBaseQuantityWithBestUnits(item.minStockLevel, undefined)}
                        </td>
                        <td className="py-2 pr-4">
                          {formatBaseQuantityWithBestUnits(String(gap), undefined)}
                        </td>
                      </tr>
                    );
                  })}
                  {!data?.lowStockItems?.length ? (
                    <tr>
                      <td className="py-3 text-muted-foreground" colSpan={5}>
                        No low stock products in the selected scope.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Open Maintenance / Missing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-4">Product</th>
                    <th className="text-left py-2 pr-4">Location</th>
                    <th className="text-left py-2 pr-4">Issue</th>
                    <th className="text-left py-2 pr-4">Open qty</th>
                    <th className="text-left py-2 pr-4">Record</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.openMaintenanceItems ?? []).map((row) => {
                    const openQty = Math.max(
                      0,
                      Number(row.quantity) -
                        Number(row.quantityReturned) -
                        Number(row.quantityDisposed),
                    );
                    return (
                      <tr key={row.id} className="border-b">
                        <td className="py-2 pr-4">{row.productName}</td>
                        <td className="py-2 pr-4">{row.locationName}</td>
                        <td className="py-2 pr-4">
                          {stockMaintenanceIssueTypeLabelByValue.get(row.issueType) ??
                            row.issueType}
                        </td>
                        <td className="py-2 pr-4">{openQty}</td>
                        <td className="py-2 pr-4">
                          <Link
                            className="underline"
                            to={`/inventory/stock-maintenance/view/${row.id}`}
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                  {!data?.openMaintenanceItems?.length ? (
                    <tr>
                      <td className="py-3 text-muted-foreground" colSpan={5}>
                        No open maintenance or missing records.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollableWrapper>
  );
}
