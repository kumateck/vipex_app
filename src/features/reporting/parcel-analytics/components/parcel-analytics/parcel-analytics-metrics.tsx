import { memo } from 'react';
import type { ParcelAnalyticsReport } from '../../types';
import { formatCount, formatMoney, formatPercent } from '../../utils';

export const ParcelAnalyticsMetrics = memo(function ParcelAnalyticsMetrics({
  report,
}: {
  report: ParcelAnalyticsReport;
}) {
  const t = report.totals;
  const items = [
    ['Parcels booked', formatCount(t.parcels)],
    ['Delivered / collected', formatCount(t.delivered)],
    ['Completion rate', formatPercent(t.completionRate)],
    ['In transit', formatCount(t.inTransit)],
    ['Awaiting collection', formatCount(t.awaitingPickup)],
    ['Uncollected 7+ days', formatCount(t.uncollected7Days)],
    ['Returned', formatCount(t.returned)],
    ['Parcel charges', formatMoney(t.chargePsw)],
    ['Receiver outstanding', formatMoney(t.receiverOutstandingPsw)],
    [
      'Volume vs previous period',
      report.volumeGrowthPct === null
        ? 'No baseline'
        : `${report.volumeGrowthPct > 0 ? '+' : ''}${formatPercent(report.volumeGrowthPct)}`,
    ],
  ];
  return (
    <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {items.map(([label, value]) => (
        <div key={label} className="rounded-md border bg-card p-4">
          <dt className="text-sm text-muted-foreground">{label}</dt>
          <dd className="mt-2 break-words text-xl font-semibold tabular-nums">{value}</dd>
        </div>
      ))}
    </dl>
  );
});
