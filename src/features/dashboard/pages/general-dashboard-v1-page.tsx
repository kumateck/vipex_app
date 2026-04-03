import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import {
  useGetCashFlowReportQuery,
  useGetIncomeStatementReportQuery,
  useGetProfitLossReportQuery,
} from '@/features/accounting/api';
import {
  useGetBranchProfitabilityReportQuery,
  useGetCreditExposureReportQuery,
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
import { formatMoneyPsw, isoDate } from '../utils/formatters';

export function GeneralDashboardV1Page() {
  const user = useAuthStore((state) => state.user);
  const permissions = new Set(user?.permissions ?? []);
  const [scope, setScope] = useState<DashboardScope | null>(null);

  const canReadAccounting = permissions.has(PermissionKeys.CanReadAccounting);
  const canViewProfitability = permissions.has(PermissionKeys.CanGetBranchProfitabilityReport);
  const canViewCredit = permissions.has(PermissionKeys.CanGetCreditExposureReport);

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

  const incomeStatement = useGetIncomeStatementReportQuery(accountingParams, {
    skip: !scope || !canReadAccounting,
  });
  const profitLoss = useGetProfitLossReportQuery(accountingParams, {
    skip: !scope || !canReadAccounting,
  });
  const cashFlow = useGetCashFlowReportQuery(accountingParams, {
    skip: !scope || !canReadAccounting,
  });

  const branchProfitability = useGetBranchProfitabilityReportQuery(
    { branchId, from, to },
    { skip: !scope || !canViewProfitability },
  );
  const creditExposure = useGetCreditExposureReportQuery(
    { branchId, agingBucket: null },
    { skip: !scope || !canViewCredit },
  );

  const loading =
    incomeStatement.isFetching ||
    profitLoss.isFetching ||
    cashFlow.isFetching ||
    branchProfitability.isFetching ||
    creditExposure.isFetching;

  const chartData = [
    {
      label: 'Revenue',
      value: Math.round(Number(incomeStatement.data?.totals.totalIncomePsw ?? 0) / 100),
    },
    {
      label: 'Expenses',
      value: Math.round(Number(incomeStatement.data?.totals.totalExpensePsw ?? 0) / 100),
    },
    {
      label: 'Net Profit',
      value: Math.round(Number(profitLoss.data?.totals.netProfitPsw ?? 0) / 100),
    },
  ];

  const creditMixData = [
    {
      label: 'Current',
      value: Math.round(Number(creditExposure.data?.totals.currentPsw ?? 0) / 100),
    },
    {
      label: '1-30',
      value: Math.round(Number(creditExposure.data?.totals.bucket1To30Psw ?? 0) / 100),
    },
    {
      label: '31-60',
      value: Math.round(Number(creditExposure.data?.totals.bucket31To60Psw ?? 0) / 100),
    },
    {
      label: '61-90',
      value: Math.round(Number(creditExposure.data?.totals.bucket61To90Psw ?? 0) / 100),
    },
    {
      label: '91+',
      value: Math.round(Number(creditExposure.data?.totals.bucket91PlusPsw ?? 0) / 100),
    },
  ];

  return (
    <div className="w-full p-4 space-y-4">
      <ScrollableWrapper>
        <Card>
          <CardHeader>
            <CardTitle>General Dashboard</CardTitle>
            <CardDescription>
              Company-wide financial snapshot for users with dashboard access.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <DashboardScopeFilterBar onApply={setScope} />

            {!scope ? (
              <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
                Apply scope to load dashboard analytics.
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
                    label="Revenue"
                    value={
                      canReadAccounting
                        ? formatMoneyPsw(incomeStatement.data?.totals.totalIncomePsw)
                        : '-'
                    }
                    loading={loading}
                  />
                  <DashboardKpiCard
                    label="Net Profit"
                    value={
                      canReadAccounting ? formatMoneyPsw(profitLoss.data?.totals.netProfitPsw) : '-'
                    }
                    loading={loading}
                  />
                  <DashboardKpiCard
                    label="Cash Flow Net"
                    value={
                      canReadAccounting
                        ? formatMoneyPsw(cashFlow.data?.totals.netChangeInCashPsw)
                        : '-'
                    }
                    loading={loading}
                  />
                  <DashboardKpiCard
                    label="Branch Net Profit"
                    value={
                      canViewProfitability
                        ? formatMoneyPsw(branchProfitability.data?.totals.netProfitPsw)
                        : '-'
                    }
                    loading={loading}
                  />
                  <DashboardKpiCard
                    label="Credit Exposure"
                    value={
                      canViewCredit
                        ? formatMoneyPsw(creditExposure.data?.totals.outstandingPsw)
                        : '-'
                    }
                    loading={loading}
                  />
                  <DashboardKpiCard
                    label="Credit Customers"
                    value={canViewCredit ? (creditExposure.data?.totals.customers ?? 0) : '-'}
                    loading={loading}
                  />
                </div>

                <DashboardExportActions
                  filenamePrefix="general-dashboard"
                  disabled={!scope}
                  rows={[
                    {
                      metric: 'Revenue',
                      value: canReadAccounting
                        ? formatMoneyPsw(incomeStatement.data?.totals.totalIncomePsw)
                        : '-',
                    },
                    {
                      metric: 'Net Profit',
                      value: canReadAccounting
                        ? formatMoneyPsw(profitLoss.data?.totals.netProfitPsw)
                        : '-',
                    },
                    {
                      metric: 'Cash Flow Net',
                      value: canReadAccounting
                        ? formatMoneyPsw(cashFlow.data?.totals.netChangeInCashPsw)
                        : '-',
                    },
                    {
                      metric: 'Branch Net Profit',
                      value: canViewProfitability
                        ? formatMoneyPsw(branchProfitability.data?.totals.netProfitPsw)
                        : '-',
                    },
                    {
                      metric: 'Credit Exposure',
                      value: canViewCredit
                        ? formatMoneyPsw(creditExposure.data?.totals.outstandingPsw)
                        : '-',
                    },
                    {
                      metric: 'Credit Customers',
                      value: canViewCredit ? (creditExposure.data?.totals.customers ?? 0) : '-',
                    },
                  ]}
                />

                <div className="grid gap-3 lg:grid-cols-2">
                  <DashboardBarChartCard
                    title="Financial Performance Chart"
                    description="Revenue, expenses, and net profit for selected scope."
                    seriesName="Amount (major units)"
                    data={chartData}
                  />
                  <DashboardDonutChartCard
                    title="Credit Aging Mix Chart"
                    description="Outstanding customer credit exposure by aging bucket."
                    data={creditMixData}
                  />
                </div>

                {!canReadAccounting && !canViewProfitability && !canViewCredit ? (
                  <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                    You can access the dashboard, but your role does not include detailed financial
                    report permissions yet.
                  </div>
                ) : null}
              </>
            )}
          </CardContent>
        </Card>
      </ScrollableWrapper>
    </div>
  );
}
