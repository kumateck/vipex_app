import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AnalyticsBarChartCard } from '../../components/chart-card';
import { MetricCard } from '../../components/metric-card';
import { AnalyticsSection } from '../../components/section';
import type { BranchAnalyticsData } from '../../api/mock-data';
import { formatPercent } from '@/features/dashboard/utils/formatters';

export function BranchAnalyticsModule({ data }: { data: BranchAnalyticsData }) {
  return (
    <AnalyticsSection
      title="Branch Analytics"
      description="Branch-level parcel throughput and delivery performance indicators."
    >
      <div className="grid gap-3 md:grid-cols-3">
        <MetricCard
          label="Delivery Success Rate"
          value={formatPercent(data.successRatePercent / 100)}
        />
        <MetricCard
          label="Branch Count"
          value={data.branchPerformance.length ? data.branchPerformance.length : 0}
        />
        <MetricCard
          label="Parcel Throughput"
          value={data.sentVsReceived.reduce((acc, item) => acc + item.value, 0)}
        />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <AnalyticsBarChartCard
          title="Branch Performance"
          description="Relative branch performance score."
          seriesName="Score"
          data={data.branchPerformance}
        />
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Parcels Sent vs Received</CardTitle>
            <CardDescription>Operational flow parity by selected scope.</CardDescription>
          </CardHeader>
          <CardContent>
            <AnalyticsBarChartCard
              title="Sent vs Received"
              description="Dispatch vs receiving volume."
              seriesName="Parcels"
              data={data.sentVsReceived}
            />
          </CardContent>
        </Card>
      </div>
    </AnalyticsSection>
  );
}
