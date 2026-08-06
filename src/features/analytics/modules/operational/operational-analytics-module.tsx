import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AnalyticsDonutChartCard } from '../../components/chart-card';
import { MetricCard } from '../../components/metric-card';
import { AnalyticsSection } from '../../components/section';
import type { OperationalAnalyticsData } from '../../api/mock-data';

export function OperationalAnalyticsModule({ data }: { data: OperationalAnalyticsData }) {
  return (
    <AnalyticsSection
      title="Operational Analytics"
      description="Parcel pipeline efficiency, delays, and processing performance."
    >
      <div className="grid gap-3 md:grid-cols-3">
        <MetricCard label="Delayed Parcels" value={data.delayedCount} />
        <MetricCard label="Avg Processing Time" value={`${data.avgProcessingMinutes} min`} />
        <MetricCard
          label="Statuses Tracked"
          value={data.statusBreakdown.length ? data.statusBreakdown.length : 0}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Parcel Status Breakdown</CardTitle>
          <CardDescription>Current parcel pipeline status distribution.</CardDescription>
        </CardHeader>
        <CardContent>
          <AnalyticsDonutChartCard
            title="Status Distribution"
            description="Processed, in-transit, delivered, and failed parcels."
            data={data.statusBreakdown}
          />
        </CardContent>
      </Card>
    </AnalyticsSection>
  );
}
