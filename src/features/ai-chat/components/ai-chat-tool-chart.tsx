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

function formatArgs(args: Record<string, unknown>): string {
  const entries = Object.entries(args).filter(([, value]) => value != null && value !== '');
  if (!entries.length) return '';
  return entries.map(([key, value]) => `${key}: ${value}`).join(', ');
}

export function AiChatToolChart({ invocation }: { invocation: AiChatToolInvocation }) {
  const title = toolTitle(invocation.toolName);
  const argsLabel = formatArgs(invocation.args);
  const hasChart = invocation.chartType !== 'none' && invocation.chartPoints.length > 0;

  return (
    <div className="space-y-2">
      <div className="flex items-baseline gap-1.5 font-mono text-xs text-muted-foreground">
        <span className="text-primary">●</span>
        <span className="text-foreground/80">{invocation.toolName}</span>
        {argsLabel ? <span>({argsLabel})</span> : null}
      </div>
      {hasChart ? (
        <div className="ml-3 border-l-2 border-muted pl-3">
          {invocation.chartType === 'bar' ? (
            <DashboardBarChartCard
              title={title}
              description="Live data, verified against the source report."
              seriesName={title}
              data={invocation.chartPoints}
            />
          ) : invocation.chartType === 'donut' ? (
            <DashboardDonutChartCard
              title={title}
              description="Live data, verified against the source report."
              data={invocation.chartPoints}
            />
          ) : (
            <DashboardLineChartCard
              title={title}
              description="Live data, verified against the source report."
              seriesName={title}
              data={invocation.chartPoints}
            />
          )}
        </div>
      ) : null}
    </div>
  );
}
