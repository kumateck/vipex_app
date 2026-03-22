import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import type { ChartConfig } from '@/components/ui/chart';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';
import type {
  Customer,
  CustomerPaymentsMonthly,
  CustomerTransactionsMonthly,
} from '@/features/customers/api';
import { formatMoney } from './customer-details.utils';

type CustomerChartsDrawerProps = {
  customer: Customer;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  year: number;
  onPreviousYear: () => void;
  onNextYear: () => void;
  monthlyTransactions: CustomerTransactionsMonthly | undefined;
  monthlyPayments: CustomerPaymentsMonthly | undefined;
  isFetchingMonthlyTransactions: boolean;
  isFetchingMonthlyPayments: boolean;
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

export function CustomerChartsDrawer({
  customer,
  open,
  onOpenChange,
  year,
  onPreviousYear,
  onNextYear,
  monthlyTransactions,
  monthlyPayments,
  isFetchingMonthlyTransactions,
  isFetchingMonthlyPayments,
}: CustomerChartsDrawerProps) {
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
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerTrigger asChild>
        <Button variant="outline">View charts</Button>
      </DrawerTrigger>
      <DrawerContent className="data-[vaul-drawer-direction=bottom]:h-[90vh] data-[vaul-drawer-direction=bottom]:max-h-[90vh]">
        <DrawerHeader>
          <DrawerTitle>Customer Charts</DrawerTitle>
          <DrawerDescription>
            Year-based customer analytics for {customer.fullname}.
          </DrawerDescription>
        </DrawerHeader>
        <ScrollArea className="flex-1 min-h-0">
          <div className="space-y-4 px-4 pb-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium">Year {year}</p>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" size="sm" onClick={onPreviousYear}>
                  Prev Year
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={onNextYear}>
                  Next Year
                </Button>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-4">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-xs text-muted-foreground">Total Sent</p>
                  <p className="text-xl font-semibold">
                    {monthlyTransactions?.totalSentCount ?? 0}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-xs text-muted-foreground">Total Received</p>
                  <p className="text-xl font-semibold">
                    {monthlyTransactions?.totalReceivedCount ?? 0}
                  </p>
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
                    <ChartContainer
                      key={`tx-${year}-${open ? 'open' : 'closed'}`}
                      config={transactionsChartConfig}
                      className="h-64 w-full"
                    >
                      <BarChart data={monthlyTransactionsChartData}>
                        <CartesianGrid vertical={false} />
                        <XAxis
                          dataKey="monthLabel"
                          tickLine={false}
                          axisLine={false}
                          tickMargin={8}
                        />
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
                      key={`tx-amount-${year}-${open ? 'open' : 'closed'}`}
                      config={transactionsChartConfig}
                      className="h-64 w-full"
                    >
                      <BarChart data={monthlyTransactionsChartData}>
                        <CartesianGrid vertical={false} />
                        <XAxis
                          dataKey="monthLabel"
                          tickLine={false}
                          axisLine={false}
                          tickMargin={8}
                        />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <ChartLegend content={<ChartLegendContent />} />
                        <Bar
                          dataKey="sentAmountCedis"
                          fill="var(--color-sentAmountCedis)"
                          radius={6}
                        />
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
                      key={`pay-${year}-${open ? 'open' : 'closed'}`}
                      config={paymentsChartConfig}
                      className="h-64 w-full"
                    >
                      <BarChart data={monthlyPaymentsChartData}>
                        <CartesianGrid vertical={false} />
                        <XAxis
                          dataKey="monthLabel"
                          tickLine={false}
                          axisLine={false}
                          tickMargin={8}
                        />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <ChartLegend content={<ChartLegendContent />} />
                        <Bar dataKey="totalCedis" fill="var(--color-totalCedis)" radius={6} />
                      </BarChart>
                    </ChartContainer>
                  )}
                </CardContent>
              </Card>
            </div>

            <DrawerClose asChild>
              <Button type="button" variant="outline" className="w-full">
                Close
              </Button>
            </DrawerClose>
          </div>
        </ScrollArea>
      </DrawerContent>
    </Drawer>
  );
}
