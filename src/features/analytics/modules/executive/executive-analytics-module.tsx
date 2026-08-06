import { AnalyticsBarChartCard, AnalyticsDonutChartCard } from '../../components/chart-card';
import { MetricCard } from '../../components/metric-card';
import { AnalyticsSection } from '../../components/section';
import type { ExecutiveAnalyticsData } from '../../api/mock-data';
import { formatMoneyPsw, formatPercent } from '@/features/dashboard/utils/formatters';

export function ExecutiveAnalyticsModule({ data }: { data: ExecutiveAnalyticsData }) {
  return (
    <AnalyticsSection
      title="Executive Analytics"
      description="Global-level strategic financial indicators and distribution trends."
    >
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Gross Revenue"
          value={formatMoneyPsw(data.revenueCards.grossRevenuePsw)}
        />
        <MetricCard label="Net Revenue" value={formatMoneyPsw(data.revenueCards.netRevenuePsw)} />
        <MetricCard label="Growth" value={formatPercent(data.revenueCards.growthPercent / 100)} />
        <MetricCard
          label="Revenue Spread"
          value={data.revenueByBranch.length ? `${data.revenueByBranch.length} branches` : '0'}
        />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <AnalyticsBarChartCard
          title="Revenue by Branch"
          description="Branch-level revenue contribution."
          seriesName="Revenue"
          data={data.revenueByBranch}
        />
        <AnalyticsDonutChartCard
          title="Payment Distribution"
          description="Share of payment channels."
          data={data.paymentDistribution}
        />
      </div>
    </AnalyticsSection>
  );
}
