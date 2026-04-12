import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AnalyticsBarChartCard, AnalyticsDonutChartCard } from '../../components/chart-card';
import { MetricCard } from '../../components/metric-card';
import { AnalyticsSection } from '../../components/section';
import type { FinancialAnalyticsData } from '../../api/mock-data';
import { formatMoneyPsw } from '@/features/dashboard/utils/formatters';

export function FinancialAnalyticsModule({ data }: { data: FinancialAnalyticsData }) {
  return (
    <AnalyticsSection
      title="Financial Analytics"
      description="Financial performance, payment mix, transaction quality, and tax health."
    >
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Estimated Revenue"
          value={formatMoneyPsw(
            data.revenueBreakdown.reduce((acc, item) => acc + item.value * 100, 0),
          )}
        />
        <MetricCard label="Refunds" value={data.refundsCount} />
        <MetricCard label="Tax Summary" value={formatMoneyPsw(data.taxSummaryPsw)} />
        <MetricCard label="Transactions" value={data.transactions.length} />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <AnalyticsBarChartCard
          title="Revenue Breakdown"
          description="Revenue contribution by stream."
          seriesName="Amount"
          data={data.revenueBreakdown}
        />
        <AnalyticsDonutChartCard
          title="Cash vs MoMo"
          description="Payment channel split."
          data={data.cashVsMomo}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Transactions</CardTitle>
          <CardDescription>Recent financial transactions for selected scope.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transaction</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.transactions.map((row, index) => (
                <TableRow key={row.id}>
                  <TableCell>TXN-{index + 1}</TableCell>
                  <TableCell>{row.date}</TableCell>
                  <TableCell>{row.method}</TableCell>
                  <TableCell>{row.status}</TableCell>
                  <TableCell className="text-right">{formatMoneyPsw(row.amountPsw)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AnalyticsSection>
  );
}
