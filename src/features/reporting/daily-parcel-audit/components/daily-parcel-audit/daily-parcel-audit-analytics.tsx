import {
  DashboardBarChartCard,
  DashboardDonutChartCard,
} from '@/features/dashboard/components/dashboard-charts';
import { useDailyParcelAuditAnalytics } from '../../hooks/use-daily-parcel-audit-analytics';
import type {
  DailyParcelAuditRow,
  DailyParcelAuditView,
} from '../../types/daily-parcel-audit.types';

type Props = { rows: DailyParcelAuditRow[]; view: DailyParcelAuditView };

export function DailyParcelAuditAnalytics({ rows, view }: Props) {
  const charts = useDailyParcelAuditAnalytics(rows);

  if (!rows.length) {
    return <p className="text-sm text-muted-foreground">No parcels match these filters.</p>;
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {view === 'receiver' ? (
        <DashboardDonutChartCard
          title="Receiver payment state"
          description="Parcel counts by current receiver principal payment state."
          data={charts.paymentStatus}
        />
      ) : null}
      <DashboardDonutChartCard
        title="Delivery state"
        description="Delivered versus pending parcels; independent of payment."
        data={charts.deliveryStatus}
      />
      <DashboardBarChartCard
        title="Principal amounts"
        description="GHS totals for the displayed parcels; credit is separate from cash collected."
        seriesName="GHS"
        data={charts.amountsGhs}
      />
      <DashboardBarChartCard
        title="Parcels by source branch"
        description="Top seven branches by parcel count; remaining branches are grouped."
        seriesName="Parcels"
        data={charts.branchParcels}
      />
      <DashboardBarChartCard
        title="Creation time (Ghana)"
        description="Parcel counts in four-hour time bands on the selected creation date."
        seriesName="Parcels"
        data={charts.creationTime}
      />
    </div>
  );
}
