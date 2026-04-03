import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import {
  DashboardBarChartCard,
  DashboardDonutChartCard,
} from '@/features/dashboard/components/dashboard-charts';
import { Line, LineChart, XAxis, YAxis } from 'recharts';

export const AnalyticsBarChartCard = DashboardBarChartCard;
export const AnalyticsDonutChartCard = DashboardDonutChartCard;

type Point = { label: string; value: number };

const lineConfig: ChartConfig = {
  value: { label: 'Value', color: 'var(--chart-1)' },
};

export function AnalyticsLineChartCard({
  title,
  description,
  data,
}: {
  title: string;
  description: string;
  data: Point[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {!data.length ? (
          <div className="text-sm text-muted-foreground">No chart data for current scope.</div>
        ) : (
          <ChartContainer config={lineConfig} className="h-[260px] w-full">
            <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <XAxis dataKey="label" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                type="monotone"
                dataKey="value"
                stroke="var(--color-value)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
