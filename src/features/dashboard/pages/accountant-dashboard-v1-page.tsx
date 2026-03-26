import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  useGetBalanceSheetReportQuery,
  useGetCashFlowReportQuery,
  useGetIncomeStatementReportQuery,
  useGetMonthlyBranchSummaryReportQuery,
  useGetTrialBalanceReportQuery,
} from '@/features/accounting/api';
import {
  useGetDailyCashConfirmationReportQuery,
  useGetExpenseByCategoryReportQuery,
} from '@/features/reporting/api/reporting.api';
import { PermissionKeys } from '@/shared/permissions/constants';
import { useAuthStore } from '@/stores/auth-store';
import { DashboardKpiCard } from '../components/dashboard-kpi-card';
import { DashboardBarChartCard, DashboardDonutChartCard } from '../components/dashboard-charts';
import { DashboardExportActions } from '../components/dashboard-export-actions';
import {
  DashboardScopeFilterBar,
  type DashboardScope,
} from '../components/dashboard-scope-filter-bar';
import { RoleDashboardGuard } from '../components/role-dashboard-guard';
import { formatMoneyPsw, isoDate } from '../utils/formatters';

export function AccountantDashboardV1Page() {
  const user = useAuthStore((state) => state.user);
  const permissions = new Set(user?.permissions ?? []);
  const [scope, setScope] = useState<DashboardScope | null>(null);

  const canReadAccounting = permissions.has(PermissionKeys.CanReadAccounting);
  const canPostAccounting = permissions.has(PermissionKeys.CanPostAccountingEntries);

  const scopeFrom = scope?.dateRange?.from;
  const scopeTo = scope?.dateRange?.to ?? scope?.dateRange?.from;
  const from = isoDate(scopeFrom);
  const to = isoDate(scopeTo);
  const branchId = scope?.branchId ?? null;
  const locationId = scope?.locationId ?? null;

  const accountingParams = {
    from,
    to,
    branchId: branchId ?? undefined,
    locationId: locationId ?? undefined,
  };

  const cashConfirmations = useGetDailyCashConfirmationReportQuery(
    { from, to, branchId, status: null },
    { skip: !scope || !canReadAccounting },
  );

  const expenseByCategory = useGetExpenseByCategoryReportQuery(
    { from, to, branchId, status: null },
    { skip: !scope || !canReadAccounting },
  );

  const trialBalance = useGetTrialBalanceReportQuery(accountingParams, {
    skip: !scope || !canReadAccounting,
  });

  const incomeStatement = useGetIncomeStatementReportQuery(accountingParams, {
    skip: !scope || !canReadAccounting,
  });

  const balanceSheet = useGetBalanceSheetReportQuery(accountingParams, {
    skip: !scope || !canReadAccounting,
  });

  const cashFlow = useGetCashFlowReportQuery(accountingParams, {
    skip: !scope || !canReadAccounting,
  });

  const monthlyBranchSummary = useGetMonthlyBranchSummaryReportQuery(accountingParams, {
    skip: !scope || !canReadAccounting,
  });

  const loading =
    cashConfirmations.isFetching ||
    expenseByCategory.isFetching ||
    trialBalance.isFetching ||
    incomeStatement.isFetching ||
    balanceSheet.isFetching ||
    cashFlow.isFetching ||
    monthlyBranchSummary.isFetching;

  const trialBalanceGapPsw = Math.abs(
    Number(trialBalance.data?.totals.debitPsw ?? 0) -
      Number(trialBalance.data?.totals.creditPsw ?? 0),
  );

  const bestBranch = useMemo(() => {
    const totals = monthlyBranchSummary.data?.totals;
    const branches = monthlyBranchSummary.data?.branches ?? [];
    if (!totals || !branches.length) return null;

    return branches
      .map((branch) => ({
        branchName: branch.branchName,
        netPsw:
          Number(totals.incomeByBranch?.[branch.branchId] ?? 0) -
          Number(totals.expenseByBranch?.[branch.branchId] ?? 0),
      }))
      .sort((a, b) => b.netPsw - a.netPsw)[0];
  }, [monthlyBranchSummary.data?.branches, monthlyBranchSummary.data?.totals]);
  const financialChartData = [
    {
      label: 'Income',
      value: Math.round(Number(incomeStatement.data?.totals.totalIncomePsw ?? 0) / 100),
    },
    {
      label: 'Expense',
      value: Math.round(Number(incomeStatement.data?.totals.totalExpensePsw ?? 0) / 100),
    },
    {
      label: 'Net',
      value: Math.round(Number(incomeStatement.data?.totals.netProfitPsw ?? 0) / 100),
    },
  ];
  const balanceMixChartData = [
    { label: 'Assets', value: Math.round(Number(balanceSheet.data?.totals.assetsPsw ?? 0) / 100) },
    {
      label: 'Liabilities',
      value: Math.round(Number(balanceSheet.data?.totals.liabilitiesPsw ?? 0) / 100),
    },
    { label: 'Equity', value: Math.round(Number(balanceSheet.data?.totals.equityPsw ?? 0) / 100) },
  ];

  return (
    <RoleDashboardGuard role="accountant">
      <div className="w-full p-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Accountant Dashboard</CardTitle>
            <CardDescription>
              Cash confirmations, expense lifecycle, reconciliation status, and accounting report
              health.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <DashboardScopeFilterBar onApply={setScope} />

            {!scope ? (
              <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
                Apply scope to load accountant analytics.
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="secondary">Branch: {branchId ?? 'All'}</Badge>
                  <Badge variant="secondary">Location: {locationId ?? 'All'}</Badge>
                  <Badge variant="secondary">
                    Date: {from}
                    {to !== from ? ` to ${to}` : ''}
                  </Badge>
                  {loading ? <Badge>Loading...</Badge> : null}
                </div>

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  <DashboardKpiCard
                    label="Net Profit"
                    value={
                      canReadAccounting
                        ? formatMoneyPsw(incomeStatement.data?.totals.netProfitPsw)
                        : '-'
                    }
                    loading={loading}
                  />
                  <DashboardKpiCard
                    label="Cash Net Change"
                    value={
                      canReadAccounting
                        ? formatMoneyPsw(cashFlow.data?.totals.netChangeInCashPsw)
                        : '-'
                    }
                    loading={loading}
                  />
                  <DashboardKpiCard
                    label="Trial Balance Gap"
                    value={canReadAccounting ? formatMoneyPsw(trialBalanceGapPsw) : '-'}
                    loading={loading}
                  />
                  <DashboardKpiCard
                    label="Expense Requests"
                    value={canReadAccounting ? (expenseByCategory.data?.totals.requests ?? 0) : '-'}
                    loading={loading}
                  />
                  <DashboardKpiCard
                    label="Cash Confirmations"
                    value={
                      canReadAccounting ? (cashConfirmations.data?.totals.confirmations ?? 0) : '-'
                    }
                    loading={loading}
                  />
                  <DashboardKpiCard
                    label="Balance Sheet Assets"
                    value={
                      canReadAccounting ? formatMoneyPsw(balanceSheet.data?.totals.assetsPsw) : '-'
                    }
                    loading={loading}
                  />
                </div>
                <DashboardExportActions
                  filenamePrefix="accountant-dashboard"
                  disabled={!scope}
                  rows={[
                    {
                      metric: 'Net Profit',
                      value: canReadAccounting
                        ? formatMoneyPsw(incomeStatement.data?.totals.netProfitPsw)
                        : '-',
                    },
                    {
                      metric: 'Cash Net Change',
                      value: canReadAccounting
                        ? formatMoneyPsw(cashFlow.data?.totals.netChangeInCashPsw)
                        : '-',
                    },
                    {
                      metric: 'Trial Balance Gap',
                      value: canReadAccounting ? formatMoneyPsw(trialBalanceGapPsw) : '-',
                    },
                    {
                      metric: 'Expense Requests',
                      value: canReadAccounting
                        ? (expenseByCategory.data?.totals.requests ?? 0)
                        : '-',
                    },
                    {
                      metric: 'Cash Confirmations',
                      value: canReadAccounting
                        ? (cashConfirmations.data?.totals.confirmations ?? 0)
                        : '-',
                    },
                    {
                      metric: 'Balance Sheet Assets',
                      value: canReadAccounting
                        ? formatMoneyPsw(balanceSheet.data?.totals.assetsPsw)
                        : '-',
                    },
                  ]}
                />

                <div className="grid gap-3 lg:grid-cols-2">
                  <DashboardBarChartCard
                    title="P&L Chart"
                    description="Income vs expense vs net for current scope."
                    seriesName="Amount (major units)"
                    data={financialChartData}
                  />
                  <DashboardDonutChartCard
                    title="Balance Sheet Mix Chart"
                    description="Asset/liability/equity composition."
                    data={balanceMixChartData}
                  />
                </div>

                <div className="grid gap-3 lg:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Cash and Expense Controls</CardTitle>
                      <CardDescription>
                        Tracking confirmation and posting lifecycle quality.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Expected cash</span>
                        <span>
                          {canReadAccounting
                            ? formatMoneyPsw(cashConfirmations.data?.totals.expectedCashPsw)
                            : '-'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Counted cash</span>
                        <span>
                          {canReadAccounting
                            ? formatMoneyPsw(cashConfirmations.data?.totals.countedCashPsw)
                            : '-'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Shortage</span>
                        <span>
                          {canReadAccounting
                            ? formatMoneyPsw(cashConfirmations.data?.totals.shortagePsw)
                            : '-'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Overage</span>
                        <span>
                          {canReadAccounting
                            ? formatMoneyPsw(cashConfirmations.data?.totals.overagePsw)
                            : '-'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Expense approved</span>
                        <span>
                          {canReadAccounting
                            ? formatMoneyPsw(expenseByCategory.data?.totals.approvedPsw)
                            : '-'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Expense posted</span>
                        <span>
                          {canPostAccounting
                            ? formatMoneyPsw(expenseByCategory.data?.totals.postedPsw)
                            : '-'}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Branch and Ledger Snapshot</CardTitle>
                      <CardDescription>
                        Quick view for consolidation and branch contribution.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Total income</span>
                        <span>
                          {canReadAccounting
                            ? formatMoneyPsw(incomeStatement.data?.totals.totalIncomePsw)
                            : '-'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total expenses</span>
                        <span>
                          {canReadAccounting
                            ? formatMoneyPsw(incomeStatement.data?.totals.totalExpensePsw)
                            : '-'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Liabilities</span>
                        <span>
                          {canReadAccounting
                            ? formatMoneyPsw(balanceSheet.data?.totals.liabilitiesPsw)
                            : '-'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Equity</span>
                        <span>
                          {canReadAccounting
                            ? formatMoneyPsw(balanceSheet.data?.totals.equityPsw)
                            : '-'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Best branch</span>
                        <span>{canReadAccounting ? (bestBranch?.branchName ?? '-') : '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Best branch net</span>
                        <span>
                          {canReadAccounting ? formatMoneyPsw(bestBranch?.netPsw ?? 0) : '-'}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </RoleDashboardGuard>
  );
}
