import { DataTable } from '@/components/datatable';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatMoney } from '../../accounting-shared';
import { type AccountingRouteReportKey, REPORT_META } from '../types/accounting-report-route.types';
import { useAccountingReportRouteData } from '../hooks/use-accounting-report-route-data';
import { ReportSummaryCards } from './report-summary-cards';
import { StatementLinesTable } from './statement-lines-table';

type ReportData = ReturnType<typeof useAccountingReportRouteData>;

export function ReportResults({
  data,
  report,
}: {
  data: ReportData;
  report: AccountingRouteReportKey;
}) {
  return (
    <>
      {data.reportMode === 'trial-balance' ? (
        <Card>
          <CardHeader>
            <CardTitle>Trial Balance</CardTitle>
            <CardDescription>{REPORT_META[report].description}</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              mode="client"
              data={data.trialBalance.data?.rows ?? []}
              columns={data.trialBalanceColumns}
              loading={data.trialBalance.isFetching}
              showSearch
              searchPlaceholder="Search trial balance"
              pageSizeOptions={[10, 20, 50]}
            />
          </CardContent>
        </Card>
      ) : null}

      {data.reportMode === 'income-statement' || data.reportMode === 'profit-loss' ? (
        <>
          <ReportSummaryCards
            income={
              data.reportMode === 'income-statement'
                ? data.incomeStatement.data
                : data.profitLoss.data
            }
          />
          <div className="grid gap-4 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Income</CardTitle>
              </CardHeader>
              <CardContent>
                <StatementLinesTable
                  rows={
                    (data.reportMode === 'income-statement'
                      ? data.incomeStatement.data
                      : data.profitLoss.data
                    )?.income ?? []
                  }
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                <StatementLinesTable
                  rows={
                    (data.reportMode === 'income-statement'
                      ? data.incomeStatement.data
                      : data.profitLoss.data
                    )?.expenses ?? []
                  }
                />
              </CardContent>
            </Card>
          </div>
        </>
      ) : null}

      {data.reportMode === 'balance-sheet' ? (
        <>
          <ReportSummaryCards balance={data.balanceSheet.data} />
          <div className="grid gap-4 xl:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Assets</CardTitle>
              </CardHeader>
              <CardContent>
                <StatementLinesTable rows={data.balanceSheet.data?.assets ?? []} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Liabilities</CardTitle>
              </CardHeader>
              <CardContent>
                <StatementLinesTable rows={data.balanceSheet.data?.liabilities ?? []} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Equity</CardTitle>
              </CardHeader>
              <CardContent>
                <StatementLinesTable rows={data.balanceSheet.data?.equity ?? []} />
              </CardContent>
            </Card>
          </div>
        </>
      ) : null}

      {data.reportMode === 'cash-flow' ? (
        <>
          <ReportSummaryCards cash={data.cashFlow.data} />
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Operating</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span>Inflows</span>
                  <span>{formatMoney(data.cashFlow.data?.operating.inflowsPsw ?? 0)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Outflows</span>
                  <span>{formatMoney(data.cashFlow.data?.operating.outflowsPsw ?? 0)}</span>
                </div>
                <div className="flex items-center justify-between font-medium">
                  <span>Net</span>
                  <span>{formatMoney(data.cashFlow.data?.operating.netPsw ?? 0)}</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Investing</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <div className="flex items-center justify-between font-medium">
                  <span>Net</span>
                  <span>{formatMoney(data.cashFlow.data?.investing.netPsw ?? 0)}</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Financing</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <div className="flex items-center justify-between font-medium">
                  <span>Net</span>
                  <span>{formatMoney(data.cashFlow.data?.financing.netPsw ?? 0)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      ) : null}

      {data.reportMode === 'monthly-branch-summary' ? (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Total Income</CardDescription>
                <CardTitle>
                  {formatMoney(data.monthlyBranchSummary.data?.totals.totalIncomePsw ?? 0)}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Total Expenses</CardDescription>
                <CardTitle>
                  {formatMoney(data.monthlyBranchSummary.data?.totals.totalExpensePsw ?? 0)}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Branches In View</CardDescription>
                <CardTitle>{data.monthlyBranchSummary.data?.branches.length ?? 0}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Income By Branch</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                mode="client"
                data={data.monthlyBranchSummary.data?.incomeRows ?? []}
                columns={data.monthlyColumns}
                loading={data.monthlyBranchSummary.isFetching}
                showSearch
                searchPlaceholder="Search branch income summary"
                pageSizeOptions={[10, 20, 50]}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Expenses By Branch</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                mode="client"
                data={data.monthlyBranchSummary.data?.expenseRows ?? []}
                columns={data.monthlyColumns}
                loading={data.monthlyBranchSummary.isFetching}
                showSearch
                searchPlaceholder="Search branch expense summary"
                pageSizeOptions={[10, 20, 50]}
              />
            </CardContent>
          </Card>
        </>
      ) : null}

      {data.reportMode === 'account-statement' ? (
        <Card>
          <CardHeader>
            <CardTitle>Account Statement</CardTitle>
            <CardDescription>{REPORT_META[report].description}</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              mode="client"
              data={data.accountStatement.data?.rows ?? []}
              columns={data.accountStatementColumns}
              loading={data.accountStatement.isFetching}
              showSearch
              searchPlaceholder="Search account statement"
              pageSizeOptions={[10, 20, 50]}
            />
          </CardContent>
        </Card>
      ) : null}
    </>
  );
}
