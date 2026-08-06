import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AnalyticsBarChartCard, AnalyticsLineChartCard } from '../../components/chart-card';
import { MetricCard } from '../../components/metric-card';
import { AnalyticsSection } from '../../components/section';
import type { DefaultAnalyticsData } from '../../api/mock-data';

export function DefaultAnalyticsModule({ data }: { data: DefaultAnalyticsData }) {
  return (
    <div className="space-y-4">
      <AnalyticsSection
        title="Today Summary"
        description="Current operational summary for selected scope."
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Parcels Sent" value={data.todaySummary.sent} />
          <MetricCard label="Parcels Received" value={data.todaySummary.received} />
          <MetricCard label="Parcels Delivered" value={data.todaySummary.delivered} />
          <MetricCard label="Parcels Pending" value={data.todaySummary.pending} />
        </div>
      </AnalyticsSection>

      <AnalyticsSection title="Alerts" description="Operational exceptions needing attention.">
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-base">Priority Alerts</CardTitle>
            <CardDescription>Live warning indicators from parcel operations.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 md:grid-cols-3 text-sm">
            <div className="flex items-center justify-between rounded-md border p-3">
              <span>Delayed parcels</span>
              <strong>{data.alerts.delayedParcels}</strong>
            </div>
            <div className="flex items-center justify-between rounded-md border p-3">
              <span>Failed deliveries</span>
              <strong>{data.alerts.failedDeliveries}</strong>
            </div>
            <div className="flex items-center justify-between rounded-md border p-3">
              <span>Pending pickups</span>
              <strong>{data.alerts.pendingPickups}</strong>
            </div>
          </CardContent>
        </Card>
      </AnalyticsSection>

      <AnalyticsSection
        title="Activity Trend"
        description="Parcel activity trend for selected period."
      >
        <AnalyticsLineChartCard
          title="Parcel Activity Trend"
          description="Daily trend of processed parcel volume."
          data={data.activityTrend}
        />
      </AnalyticsSection>

      <div className="grid gap-3 lg:grid-cols-2">
        <AnalyticsSection
          title="Branch Activity"
          description="Top branches by non-financial parcel volume."
        >
          <AnalyticsBarChartCard
            title="Top Branches by Parcel Volume"
            description="Highest parcel throughput branches in selected scope."
            seriesName="Parcels"
            data={data.topBranchesByVolume}
          />
        </AnalyticsSection>

        <AnalyticsSection
          title="My Stats"
          description="Personal operational performance indicators."
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-base">My Performance</CardTitle>
              <CardDescription>Only your own operational workload summary.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Handled parcels today</span>
                <strong>{data.myStats.handledParcelsToday}</strong>
              </div>
              <div className="flex justify-between">
                <span>Delivered today</span>
                <strong>{data.myStats.deliveredToday}</strong>
              </div>
              <div className="flex justify-between">
                <span>Pending tasks</span>
                <strong>{data.myStats.pendingTasks}</strong>
              </div>
            </CardContent>
          </Card>
        </AnalyticsSection>
      </div>
    </div>
  );
}
