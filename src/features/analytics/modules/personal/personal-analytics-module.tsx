import { MetricCard } from '../../components/metric-card';
import { AnalyticsSection } from '../../components/section';
import type { PersonalAnalyticsData } from '../../api/mock-data';
import { formatPercent } from '@/features/dashboard/utils/formatters';

export function PersonalAnalyticsModule({ data }: { data: PersonalAnalyticsData }) {
  return (
    <AnalyticsSection
      title="Personal Analytics"
      description="Your own productivity and quality metrics only."
    >
      <div className="grid gap-3 md:grid-cols-3">
        <MetricCard label="Completed Tasks" value={data.performance.completedTasks} />
        <MetricCard
          label="On-time Rate"
          value={formatPercent(data.performance.onTimeRatePercent / 100)}
        />
        <MetricCard
          label="Avg Resolution Time"
          value={`${data.performance.avgResolutionMinutes} min`}
        />
      </div>
    </AnalyticsSection>
  );
}
