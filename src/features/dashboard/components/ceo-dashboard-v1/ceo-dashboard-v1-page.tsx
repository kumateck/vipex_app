import { useMemo, useState } from 'react';
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
  useGetDeliveryPerformanceReportQuery,
} from '@/features/reporting/api/reporting.api';
import { PermissionKeys } from '@/shared/permissions/constants';
import { useAuthStore } from '@/stores/auth-store';
import { DashboardKpiCard } from '../dashboard-kpi-card';
import { DashboardBarChartCard, DashboardDonutChartCard } from '../dashboard-charts';
import { DashboardExportActions } from '../dashboard-export-actions';
import { DashboardScopeFilterBar, type DashboardScope } from '../dashboard-scope-filter-bar';
import { RoleDashboardGuard } from '../role-dashboard-guard';
import { formatMoneyPsw, formatPercent, isoDate } from '../../utils/formatters';
import { ExecutiveInsightsPanel } from './executive-insights-panel';
import { ManagementDailyBriefPanel } from './management-daily-brief-panel';

export function CEODashboardV1Page() {
  const user = useAuthStore((state) => state.user);
  const permissions = new Set(user?.permissions ?? []);
  const [scope, setScope] = useState<DashboardScope | null>(null);

  const canReadAccounting = permissions.has(PermissionKeys.CanReadAccounting);
  const canViewProfitability = permissions.has(PermissionKeys.CanViewReportBranchProfitSummary);
  const canViewCredit = permissions.has(PermissionKeys.CanViewReportCustomersCreditSummary);
  const canViewParcel = permissions.has(PermissionKeys.CanViewReportParcelsStatusSummary);

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
  const deliveryPerformance = useGetDeliveryPerformanceReportQuery(
    { branchId, riderUserId: null, from, to },
    { skip: !scope || !canViewParcel },
  );

  const loading =
    incomeStatement.isFetching ||
    profitLoss.isFetching ||
    cashFlow.isFetching ||
    branchProfitability.isFetching ||
    creditExposure.isFetching ||
    deliveryPerformance.isFetching;

  const deliveryRate = useMemo(() => {
    const deliveries = deliveryPerformance.data?.totals.deliveries ?? 0;
    if (!deliveries) return 0;
    return (deliveryPerformance.data?.totals.delivered ?? 0) / deliveries;
  }, [deliveryPerformance.data?.totals.delivered, deliveryPerformance.data?.totals.deliveries]);

  const topBranches = useMemo(() => {
    const rows = branchProfitability.data?.rows ?? [];
    return [...rows].sort((a, b) => b.netProfitPsw - a.netProfitPsw).slice(0, 5);
  }, [branchProfitability.data?.rows]);
  const executiveChartData = [
    {
      label: 'Revenue',
      value: Math.round(Number(incomeStatement.data?.totals.totalIncomePsw ?? 0) / 100),
    },
    {
      label: 'Net Profit',
      value: Math.round(Number(profitLoss.data?.totals.netProfitPsw ?? 0) / 100),
    },
    {
      label: 'Cash Flow',
      value: Math.round(Number(cashFlow.data?.totals.netChangeInCashPsw ?? 0) / 100),
    },
  ];
  const creditAgingChartData = [
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
    <RoleDashboardGuard role="ceo">
      <div className="w-full p-4 space-y-4">
        <ScrollableWrapper>
          <Card>
            <CardHeader>
              <CardTitle>CEO Dashboard</CardTitle>
              <CardDescription>
                Executive view of profitability, liquidity, delivery performance, and customer
                credit risk.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <DashboardScopeFilterBar onApply={setScope} />

              {!scope ? (
                <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
                  Apply scope to load executive analytics.
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
                        canReadAccounting
                          ? formatMoneyPsw(profitLoss.data?.totals.netProfitPsw)
                          : '-'
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
                      label="Credit Exposure"
                      value={
                        canViewCredit
                          ? formatMoneyPsw(creditExposure.data?.totals.outstandingPsw)
                          : '-'
                      }
                      loading={loading}
                    />
                    <DashboardKpiCard
                      label="Delivery Performance"
                      value={canViewParcel ? formatPercent(deliveryRate) : '-'}
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
                  </div>
                  <DashboardExportActions
                    filenamePrefix="ceo-dashboard"
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
                        metric: 'Credit Exposure',
                        value: canViewCredit
                          ? formatMoneyPsw(creditExposure.data?.totals.outstandingPsw)
                          : '-',
                      },
                      {
                        metric: 'Delivery Performance',
                        value: canViewParcel ? formatPercent(deliveryRate) : '-',
                      },
                      {
                        metric: 'Branch Net Profit',
                        value: canViewProfitability
                          ? formatMoneyPsw(branchProfitability.data?.totals.netProfitPsw)
                          : '-',
                      },
                    ]}
                  />

                  <div className="grid gap-3 lg:grid-cols-2">
                    <DashboardBarChartCard
                      title="Executive Trend Chart"
                      description="Revenue, net profit, and cashflow in one view."
                      seriesName="Amount (major units)"
                      data={executiveChartData}
                    />
                    <DashboardDonutChartCard
                      title="Credit Aging Mix Chart"
                      description="Credit exposure bucket distribution."
                      data={creditAgingChartData}
                    />
                  </div>

                  <div className="grid gap-3 lg:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Branch Leaderboard</CardTitle>
                        <CardDescription>
                          Top branches by net profitability for selected scope.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        {!topBranches.length ? (
                          <div className="text-muted-foreground">
                            No branch profitability data available.
                          </div>
                        ) : (
                          topBranches.map((row, index) => (
                            <div key={row.branchId} className="flex justify-between">
                              <span>
                                {index + 1}. {row.branchName}
                              </span>
                              <span>{formatMoneyPsw(row.netProfitPsw)}</span>
                            </div>
                          ))
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Risk and Service Snapshot</CardTitle>
                        <CardDescription>
                          Executive-level risk exposure and service trend checks.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Credit customers</span>
                          <span>
                            {canViewCredit ? (creditExposure.data?.totals.customers ?? 0) : '-'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Current credit bucket</span>
                          <span>
                            {canViewCredit
                              ? formatMoneyPsw(creditExposure.data?.totals.currentPsw)
                              : '-'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>91+ day exposure</span>
                          <span>
                            {canViewCredit
                              ? formatMoneyPsw(creditExposure.data?.totals.bucket91PlusPsw)
                              : '-'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Deliveries</span>
                          <span>
                            {canViewParcel
                              ? (deliveryPerformance.data?.totals.deliveries ?? 0)
                              : '-'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Delivered</span>
                          <span>
                            {canViewParcel
                              ? (deliveryPerformance.data?.totals.delivered ?? 0)
                              : '-'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Out for delivery</span>
                          <span>
                            {canViewParcel
                              ? (deliveryPerformance.data?.totals.outForDelivery ?? 0)
                              : '-'}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <ExecutiveInsightsPanel from={from} to={to} branchId={branchId} />
                  <ManagementDailyBriefPanel />
                </>
              )}
            </CardContent>
          </Card>
        </ScrollableWrapper>
      </div>
    </RoleDashboardGuard>
  );
}
