import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import type { ChartConfig } from '@/components/ui/chart';
import type {
  CustomerPaymentsMonthly,
  CustomerTransactionsMonthly,
} from '@/features/customers/api';
import { formatMoney } from './customer-details.utils';

type CustomerChartsContentProps = {
  monthlyTransactions: CustomerTransactionsMonthly | undefined;
  monthlyPayments: CustomerPaymentsMonthly | undefined;
  isFetchingMonthlyTransactions: boolean;
  isFetchingMonthlyPayments: boolean;
  year: number;
};

const transactionsChartConfig = {
  sentCount: { label: 'Sent Count', color: 'var(--chart-1)' },
  receivedCount: { label: 'Received Count', color: 'var(--chart-2)' },
  sentAmountCedis: { label: 'Sent Amount (GHS)', color: 'var(--chart-3)' },
  receivedAmountCedis: { label: 'Received Amount (GHS)', color: 'var(--chart-4)' },
} satisfies ChartConfig;

const paymentsChartConfig = {
  totalCedis: { label: 'Total Paid (GHS)', color: 'var(--chart-3)' },
} satisfies ChartConfig;

export function CustomerChartsContent({
  monthlyTransactions,
  monthlyPayments,
  isFetchingMonthlyTransactions,
  isFetchingMonthlyPayments,
  year,
}: CustomerChartsContentProps) {
  const monthlyTransactionsChartData = (monthlyTransactions?.months ?? []).map((row) => ({
    ...row,
    sentAmountCedis: row.sentAmountPsw / 100,
    receivedAmountCedis: row.receivedAmountPsw / 100,
  }));

  const monthlyPaymentsChartData = (monthlyPayments?.months ?? []).map((row) => ({
    ...row,
    totalCedis: row.totalPsw / 100,
  }));

  return (
    <>
      <div className="grid gap-3 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Total Sent</p>
            <p className="text-xl font-semibold">{monthlyTransactions?.totalSentCount ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Total Received</p>
            <p className="text-xl font-semibold">{monthlyTransactions?.totalReceivedCount ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Sent Amount</p>
            <p className="text-xl font-semibold">
              {formatMoney(monthlyTransactions?.totalSentAmountPsw ?? 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Received Amount</p>
            <p className="text-xl font-semibold">
              {formatMoney(monthlyTransactions?.totalReceivedAmountPsw ?? 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Sent vs Received Count</CardTitle>
            <CardDescription>Parcel totals by month.</CardDescription>
          </CardHeader>
          <CardContent>
            {isFetchingMonthlyTransactions ? (
              <p className="text-xs text-muted-foreground">Loading monthly chart...</p>
            ) : (
              <ChartContainer config={transactionsChartConfig} className="h-64 w-full">
                <BarChart data={monthlyTransactionsChartData}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="monthLabel" tickLine={false} axisLine={false} tickMargin={8} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar dataKey="sentCount" fill="var(--color-sentCount)" radius={6} />
                  <Bar dataKey="receivedCount" fill="var(--color-receivedCount)" radius={6} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Sent vs Received Amount</CardTitle>
            <CardDescription>Amounts involved by month.</CardDescription>
          </CardHeader>
          <CardContent>
            {isFetchingMonthlyTransactions ? (
              <p className="text-xs text-muted-foreground">Loading monthly chart...</p>
            ) : (
              <ChartContainer
                id={`customer-transactions-amount-${year}`}
                config={transactionsChartConfig}
                className="h-64 w-full"
              >
                <BarChart data={monthlyTransactionsChartData}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="monthLabel" tickLine={false} axisLine={false} tickMargin={8} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar dataKey="sentAmountCedis" fill="var(--color-sentAmountCedis)" radius={6} />
                  <Bar
                    dataKey="receivedAmountCedis"
                    fill="var(--color-receivedAmountCedis)"
                    radius={6}
                  />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Payments</CardTitle>
            <CardDescription>Payments received by month.</CardDescription>
          </CardHeader>
          <CardContent>
            {isFetchingMonthlyPayments ? (
              <p className="text-xs text-muted-foreground">Loading monthly chart...</p>
            ) : (
              <ChartContainer
                id={`customer-payments-${year}`}
                config={paymentsChartConfig}
                className="h-64 w-full"
              >
                <BarChart data={monthlyPaymentsChartData}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="monthLabel" tickLine={false} axisLine={false} tickMargin={8} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar dataKey="totalCedis" fill="var(--color-totalCedis)" radius={6} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
