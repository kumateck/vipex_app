import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { Bar, BarChart, Cell, Line, LineChart, Pie, PieChart, XAxis, YAxis } from 'recharts';

export type Point = {
  label: string;
  value: number;
};

const DEFAULT_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
];

function buildConfig(seriesName: string): ChartConfig {
  return {
    value: { label: seriesName, color: 'var(--chart-1)' },
  };
}

export function DashboardBarChartCard({
  title,
  description,
  seriesName,
  data,
}: {
  title: string;
  description: string;
  seriesName: string;
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
          <ChartContainer config={buildConfig(seriesName)} className="h-[260px] w-full">
            <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <XAxis dataKey="label" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="value" radius={6} fill="var(--color-value)" />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}

export function DashboardLineChartCard({
  title,
  description,
  seriesName,
  data,
}: {
  title: string;
  description: string;
  seriesName: string;
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
          <ChartContainer config={buildConfig(seriesName)} className="h-[260px] w-full">
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

export function DashboardDonutChartCard({
  title,
  description,
  data,
}: {
  title: string;
  description: string;
  data: Point[];
}) {
  const chartConfig: ChartConfig = data.reduce<ChartConfig>((acc, point, index) => {
    const key = point.label.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    acc[key] = {
      label: point.label,
      color: DEFAULT_COLORS[index % DEFAULT_COLORS.length],
    };
    return acc;
  }, {});

  const normalizedData = data.map((point) => ({
    ...point,
    key: point.label.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
  }));

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
          <ChartContainer config={chartConfig} className="h-[260px] w-full">
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent nameKey="label" />} />
              <Pie
                data={normalizedData}
                dataKey="value"
                nameKey="label"
                innerRadius={52}
                outerRadius={88}
                strokeWidth={2}
              >
                {normalizedData.map((point, index) => (
                  <Cell key={point.key} fill={DEFAULT_COLORS[index % DEFAULT_COLORS.length]} />
                ))}
              </Pie>
              <ChartLegend
                content={<ChartLegendContent nameKey="label" />}
                verticalAlign="bottom"
              />
            </PieChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
