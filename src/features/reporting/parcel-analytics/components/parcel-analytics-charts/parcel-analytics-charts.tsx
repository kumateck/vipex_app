import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Bar, BarChart, Line, LineChart, XAxis, YAxis } from 'recharts';
import type { ParcelAnalyticsReport } from '../../types';

const config = { parcels: { label: 'Parcels', color: 'var(--chart-1)' } };
export function ParcelAnalyticsCharts({ report }: { report: ParcelAnalyticsReport }) {
  return (
    <div className="grid gap-4 pt-4 xl:grid-cols-2">
      <section className="space-y-3" aria-label="Daily booking trend">
        <h2 className="font-semibold">Daily parcel bookings</h2>
        <ChartContainer config={config} className="h-[260px] w-full">
          <LineChart accessibilityLayer data={report.trend} margin={{ left: 0, right: 12 }}>
            <XAxis dataKey="day" tickFormatter={(day: string) => day.slice(5)} minTickGap={30} />
            <YAxis allowDecimals={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line
              dataKey="parcels"
              type="linear"
              stroke="var(--color-parcels)"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ChartContainer>
      </section>
      <section className="space-y-3" aria-label="Collection aging">
        <h2 className="font-semibold">Awaiting collection · days since receipt</h2>
        <ChartContainer config={config} className="h-[260px] w-full">
          <BarChart accessibilityLayer data={report.aging} margin={{ left: 0, right: 12 }}>
            <XAxis dataKey="label" />
            <YAxis allowDecimals={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar
              dataKey="parcels"
              fill="var(--color-parcels)"
              radius={4}
              isAnimationActive={false}
            />
          </BarChart>
        </ChartContainer>
        <p className="text-xs text-muted-foreground">
          Includes arrived, customer contacted, and awaiting pickup parcels with a receipt
          timestamp. Seven or more days is an operational flag.
        </p>
      </section>
      <p className="text-sm text-muted-foreground xl:col-span-2">
        Average booking to receipt:{' '}
        {report.totals.averageBookingToReceiptHours === null
          ? 'No valid receipt timestamps'
          : `${report.totals.averageBookingToReceiptHours.toFixed(1)} hours`}
        . This measures creation to destination receipt.
      </p>
    </div>
  );
}
