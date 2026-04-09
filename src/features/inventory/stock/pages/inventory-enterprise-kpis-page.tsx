import { useState } from 'react';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { useGetInventoryEnterpriseKpisQuery } from '@/features/inventory/api';
import { useAuthStore } from '@/stores/auth-store';

export function InventoryEnterpriseKpisPage() {
  const companyId = useAuthStore((state) => state.user?.company?.id ?? null);
  const [days, setDays] = useState('30');
  const { data } = useGetInventoryEnterpriseKpisQuery(
    { companyId: companyId ?? '', days: Number(days) },
    { skip: !companyId },
  );

  return (
    <ScrollableWrapper>
      <div className="w-full p-4 space-y-4">
        <div className="max-w-xs space-y-1">
          <p className="text-sm font-medium">Reporting Window (days)</p>
          <input
            className="h-9 w-full rounded border px-3"
            value={days}
            onChange={(e) => setDays(e.target.value)}
          />
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded border p-4">
            <p className="text-xs text-muted-foreground">Movement Count</p>
            <p className="text-xl font-semibold">{data?.movements.count ?? 0}</p>
            <p className="text-xs text-muted-foreground">
              Issue: {data?.movements.issueQuantity ?? '0'}
            </p>
            <p className="text-xs text-muted-foreground">
              Receipt: {data?.movements.receiptQuantity ?? '0'}
            </p>
          </div>
          <div className="rounded border p-4">
            <p className="text-xs text-muted-foreground">Service Level</p>
            <p className="text-xl font-semibold">{data?.serviceLevel.fillRatePct ?? 0}%</p>
            <p className="text-xs text-muted-foreground">
              Requested: {data?.serviceLevel.requestedQuantity ?? '0'}
            </p>
            <p className="text-xs text-muted-foreground">
              Fulfilled: {data?.serviceLevel.fulfilledQuantity ?? '0'}
            </p>
          </div>
          <div className="rounded border p-4">
            <p className="text-xs text-muted-foreground">Aging Risk</p>
            <p className="text-xl font-semibold">{data?.aging.atRiskQuantity ?? '0'}</p>
            <p className="text-xs text-muted-foreground">
              Near Expiry Lots: {data?.aging.nearExpiryLots ?? 0}
            </p>
            <p className="text-xs text-muted-foreground">
              Expired Lots: {data?.aging.expiredLots ?? 0}
            </p>
          </div>
        </div>
      </div>
    </ScrollableWrapper>
  );
}
