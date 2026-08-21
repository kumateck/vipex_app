import {
  DashboardBarChartCard,
  DashboardDonutChartCard,
  DashboardLineChartCard,
} from '@/features/dashboard/components/dashboard-charts';
import type { AiChatToolInvocation } from '../api/ai-chat.api';

function toolTitle(toolName: string): string {
  return toolName
    .replace(/^get_/, '')
    .split('_')
    .map((word) => word[0]?.toUpperCase() + word.slice(1))
    .join(' ');
}

export function AiChatToolChart({ invocation }: { invocation: AiChatToolInvocation }) {
  if (invocation.chartType === 'none' || !invocation.chartPoints.length) return null;

  const title = toolTitle(invocation.toolName);
  const description = 'From live data, verified against the source report.';

  if (invocation.chartType === 'bar') {
    return (
      <DashboardBarChartCard
        title={title}
        description={description}
        seriesName={title}
        data={invocation.chartPoints}
      />
    );
  }
  if (invocation.chartType === 'donut') {
    return (
      <DashboardDonutChartCard
        title={title}
        description={description}
        data={invocation.chartPoints}
      />
    );
  }
  return (
    <DashboardLineChartCard
      title={title}
      description={description}
      seriesName={title}
      data={invocation.chartPoints}
    />
  );
}
