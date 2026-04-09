import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  type BalanceSheetReport,
  type CashFlowReport,
  type IncomeStatementReport,
} from '../../../api';
import { formatMoney } from '../../accounting-shared';

export function ReportSummaryCards(props: {
  income?: IncomeStatementReport;
  balance?: BalanceSheetReport;
  cash?: CashFlowReport;
}) {
  if (props.income) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Income</CardDescription>
            <CardTitle>{formatMoney(props.income.totals.totalIncomePsw)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Expenses</CardDescription>
            <CardTitle>{formatMoney(props.income.totals.totalExpensePsw)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Net Profit</CardDescription>
            <CardTitle>{formatMoney(props.income.totals.netProfitPsw)}</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (props.balance) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Assets</CardDescription>
            <CardTitle>{formatMoney(props.balance.totals.assetsPsw)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Liabilities</CardDescription>
            <CardTitle>{formatMoney(props.balance.totals.liabilitiesPsw)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Equity</CardDescription>
            <CardTitle>{formatMoney(props.balance.totals.equityPsw)}</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (props.cash) {
    return (
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Operating Inflows</CardDescription>
            <CardTitle>{formatMoney(props.cash.operating.inflowsPsw)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Operating Outflows</CardDescription>
            <CardTitle>{formatMoney(props.cash.operating.outflowsPsw)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Investing Net</CardDescription>
            <CardTitle>{formatMoney(props.cash.investing.netPsw)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Net Change In Cash</CardDescription>
            <CardTitle>{formatMoney(props.cash.totals.netChangeInCashPsw)}</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return null;
}
