import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useGetInventoryValuationSummaryQuery,
  useRecomputeInventoryValuationSnapshotsMutation,
  useSyncInventoryFinancialPostingsMutation,
} from '@/features/inventory/api';
import { useListInventoryLocationOptionsQuery } from '@/features/inventory/locations/api/inventory-locations.api';
import { useAuthStore } from '@/stores/auth-store';

export function InventoryValuationPage() {
  const companyId = useAuthStore((state) => state.user?.company?.id ?? null);
  const [locationId, setLocationId] = useState('all');
  const [appliedLocationId, setAppliedLocationId] = useState('all');
  const { data: locations = [] } = useListInventoryLocationOptionsQuery(
    { companyId },
    { skip: !companyId },
  );
  const queryArgs = useMemo(
    () => ({
      companyId: companyId ?? '',
      locationId: appliedLocationId === 'all' ? null : appliedLocationId,
    }),
    [companyId, appliedLocationId],
  );
  const { data } = useGetInventoryValuationSummaryQuery(queryArgs, { skip: !companyId });
  const [recompute, { isLoading: isRecomputing }] =
    useRecomputeInventoryValuationSnapshotsMutation();
  const [syncPostings, { isLoading: isSyncing }] = useSyncInventoryFinancialPostingsMutation();

  return (
    <ScrollableWrapper>
      <div className="w-full p-4 space-y-4">
        <div className="grid gap-2 max-w-sm">
          <p className="text-sm font-medium">Location (optional)</p>
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
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setAppliedLocationId(locationId);
            }}
          >
            Refresh
          </Button>
          <Button
            variant="outline"
            disabled={!companyId || isRecomputing}
            onClick={() => {
              if (!companyId) return;
              void recompute({ companyId });
            }}
          >
            Recompute Snapshots
          </Button>
          <Button
            disabled={!companyId || isSyncing}
            onClick={() => {
              if (!companyId) return;
              void syncPostings({ companyId });
            }}
          >
            Sync Financial Postings
          </Button>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded border p-4">
            <p className="text-xs text-muted-foreground">Total Quantity</p>
            <p className="text-2xl font-semibold">{data?.totals.totalQuantity ?? '0'}</p>
          </div>
          <div className="rounded border p-4">
            <p className="text-xs text-muted-foreground">Total Value</p>
            <p className="text-2xl font-semibold">{data?.totals.totalValue ?? '0'}</p>
          </div>
        </div>
      </div>
    </ScrollableWrapper>
  );
}
