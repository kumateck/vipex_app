import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-searchable';
import { Spinner } from '@/components/ui/spinner';
import { useListReorderSuggestionsQuery } from '@/features/inventory/api';
import { useListInventoryLocationOptionsQuery } from '@/features/inventory/locations/api/inventory-locations.api';
import { useAuthStore } from '@/stores/auth-store';
import { formatBaseQuantityWithBestUnits } from '@/shared/inventory/quantity-display';

function locationTypeLabel(type: number) {
  if (type === 0) return 'Main Store';
  if (type === 1) return 'Branch Store';
  if (type === 2) return 'Consumption Location';
  return 'Unknown';
}

export function InventoryReorderSuggestionsPage() {
  const companyId = useAuthStore((state) => state.user?.company?.id ?? null);
  const [locationId, setLocationId] = useState<string>('all');

  const { data: locations = [] } = useListInventoryLocationOptionsQuery(
    { companyId },
    { skip: !companyId },
  );
  const queryArg = useMemo(
    () =>
      companyId
        ? {
            companyId,
            locationId: locationId === 'all' ? null : locationId,
          }
        : undefined,
    [companyId, locationId],
  );
  const { data, isLoading } = useListReorderSuggestionsQuery(queryArg, { skip: !queryArg });

  return (
    <ScrollableWrapper>
      <div className="w-full p-4 space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Reorder Suggestions</CardTitle>
            <Button asChild variant="outline">
              <Link to="/inventory">Back to inventory dashboard</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
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
              <div className="text-sm text-muted-foreground">
                {data?.totalRows ?? 0} suggestions generated
                {data?.generatedAt ? ` at ${new Date(data.generatedAt).toLocaleString()}` : ''}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Suggested Replenishments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-4">Product</th>
                    <th className="text-left py-2 pr-4">Location</th>
                    <th className="text-left py-2 pr-4">Current</th>
                    <th className="text-left py-2 pr-4">Min</th>
                    <th className="text-left py-2 pr-4">Reorder Qty</th>
                    <th className="text-left py-2 pr-4">Suggested Source</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.rows ?? []).map((row) => (
                    <tr key={`${row.locationId}:${row.productId}`} className="border-b align-top">
                      <td className="py-2 pr-4">
                        <div>{row.productName}</div>
                        <div className="text-xs text-muted-foreground">{row.productSku}</div>
                      </td>
                      <td className="py-2 pr-4">
                        <div>{row.locationName}</div>
                        <div className="text-xs text-muted-foreground">
                          {locationTypeLabel(row.locationType)}
                        </div>
                      </td>
                      <td className="py-2 pr-4">
                        {formatBaseQuantityWithBestUnits(row.currentQuantity, undefined)}
                      </td>
                      <td className="py-2 pr-4">
                        {formatBaseQuantityWithBestUnits(row.minStockLevel, undefined)}
                      </td>
                      <td className="py-2 pr-4">
                        {formatBaseQuantityWithBestUnits(row.reorderQuantity, undefined)}
                      </td>
                      <td className="py-2 pr-4">
                        {row.suggestedSources.length ? (
                          <div className="space-y-1">
                            {row.suggestedSources.map((source) => (
                              <div key={source.locationId} className="text-xs">
                                {source.locationName} ({locationTypeLabel(source.locationType)}) -{' '}
                                {formatBaseQuantityWithBestUnits(
                                  source.availableQuantity,
                                  undefined,
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">No source suggestion</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {!isLoading && !(data?.rows ?? []).length ? (
                    <tr>
                      <td className="py-3 text-muted-foreground" colSpan={6}>
                        No reorder suggestions for the selected scope.
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
