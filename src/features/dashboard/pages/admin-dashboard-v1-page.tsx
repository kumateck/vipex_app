import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import {
  useGetBranchProfitabilityReportQuery,
  useGetCreditExposureReportQuery,
  useGetDailyCashConfirmationReportQuery,
  useGetDeliveryPerformanceReportQuery,
  useGetParcelStatusSummaryReportQuery,
  useGetShiftRevenueReportQuery,
  useGetToBePaidOutstandingReportQuery,
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
import { formatMoneyPsw, formatPercent, isoDate } from '../utils/formatters';

export function AdminDashboardV1Page() {
  const user = useAuthStore((state) => state.user);
  const permissions = new Set(user?.permissions ?? []);
  const [scope, setScope] = useState<DashboardScope | null>(null);

  const canViewParcel = permissions.has(PermissionKeys.CanGetParcelStatusSummaryReport);
  const canViewShiftRevenue = permissions.has(PermissionKeys.CanGetShiftRevenueReport);
  const canViewProfitability = permissions.has(PermissionKeys.CanGetBranchProfitabilityReport);
  const canViewCredit = permissions.has(PermissionKeys.CanGetCreditExposureReport);
  const canViewOutstanding = permissions.has(PermissionKeys.CanGetOutstandingToBePaidReport);
  const canViewCashConfirmations = permissions.has(PermissionKeys.CanReadAccounting);

  const scopeFrom = scope?.dateRange?.from;
  const scopeTo = scope?.dateRange?.to ?? scope?.dateRange?.from;
  const from = isoDate(scopeFrom);
  const to = isoDate(scopeTo);
  const branchId = scope?.branchId ?? null;
  const locationId = scope?.locationId ?? null;

  const parcelStatus = useGetParcelStatusSummaryReportQuery(
    { branchId, from, to },
    { skip: !scope || !canViewParcel },
  );

  const deliveryPerformance = useGetDeliveryPerformanceReportQuery(
    { branchId, riderUserId: null, from, to },
    { skip: !scope || !canViewParcel },
  );

  const shiftRevenue = useGetShiftRevenueReportQuery(
    { branchId, locationId, from, to, shiftSessionId: null },
    { skip: !scope || !canViewShiftRevenue },
  );

  const branchProfitability = useGetBranchProfitabilityReportQuery(
    { branchId, from, to },
    { skip: !scope || !canViewProfitability },
  );

  const creditExposure = useGetCreditExposureReportQuery(
    { branchId, agingBucket: null },
    { skip: !scope || !canViewCredit },
  );

  const outstanding = useGetToBePaidOutstandingReportQuery(
    { sourceBranchId: branchId, destinationBranchId: null, from, to },
    { skip: !scope || !canViewOutstanding },
  );

  const cashConfirmations = useGetDailyCashConfirmationReportQuery(
    { branchId, from, to, status: null },
    { skip: !scope || !canViewCashConfirmations },
  );

  const loading =
    parcelStatus.isFetching ||
    deliveryPerformance.isFetching ||
    shiftRevenue.isFetching ||
    branchProfitability.isFetching ||
    creditExposure.isFetching ||
    outstanding.isFetching ||
    cashConfirmations.isFetching;

  const deliveryRate = useMemo(() => {
    const deliveries = deliveryPerformance.data?.totals.deliveries ?? 0;
    if (!deliveries) return 0;
    return (deliveryPerformance.data?.totals.delivered ?? 0) / deliveries;
  }, [deliveryPerformance.data?.totals.delivered, deliveryPerformance.data?.totals.deliveries]);

  const topBranches = useMemo(() => {
    const rows = branchProfitability.data?.rows ?? [];
    return [...rows].sort((a, b) => b.netProfitPsw - a.netProfitPsw).slice(0, 5);
  }, [branchProfitability.data?.rows]);

  const cashExceptionCount = useMemo(() => {
    const rows = cashConfirmations.data?.rows ?? [];
    return rows.filter((row) => Number(row.shortagePsw ?? 0) > 0 || Number(row.overagePsw ?? 0) > 0)
      .length;
  }, [cashConfirmations.data?.rows]);
  const topBranchChartData = topBranches.map((row) => ({
    label: row.branchName,
    value: Math.round(Number(row.netProfitPsw ?? 0) / 100),
  }));
  const exceptionChartData = [
    {
      label: 'Undelivered',
      value: Math.max(
        (deliveryPerformance.data?.totals.deliveries ?? 0) -
          (deliveryPerformance.data?.totals.delivered ?? 0),
        0,
      ),
    },
    { label: 'Cash Exceptions', value: cashExceptionCount },
    { label: 'Credit Customers', value: creditExposure.data?.totals.customers ?? 0 },
  ];

  return (
    <RoleDashboardGuard role="admin">
      <div className="w-full p-4 space-y-4">
        <ScrollableWrapper>
          <Card>
            <CardHeader>
              <CardTitle>Admin Dashboard</CardTitle>
              <CardDescription>
                Consolidated operational and financial visibility with branch and location scope
                controls.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <DashboardScopeFilterBar onApply={setScope} />

              {!scope ? (
                <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
                  Apply scope to load admin analytics.
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
                      label="Parcels"
                      value={canViewParcel ? (parcelStatus.data?.totals.parcels ?? 0) : '-'}
                      loading={loading}
                    />
                    <DashboardKpiCard
                      label="Delivery Success"
                      value={canViewParcel ? formatPercent(deliveryRate) : '-'}
                      loading={loading}
                    />
                    <DashboardKpiCard
                      label="Shift Revenue (Net)"
                      value={
                        canViewShiftRevenue ? formatMoneyPsw(shiftRevenue.data?.totals.netPsw) : '-'
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
                      label="To-Be-Paid Outstanding"
                      value={
                        canViewOutstanding
                          ? formatMoneyPsw(outstanding.data?.totals.outstandingPsw)
                          : '-'
                      }
                      loading={loading}
                    />
                  </div>
                  <DashboardExportActions
                    filenamePrefix="admin-dashboard"
                    disabled={!scope}
                    rows={[
                      {
                        metric: 'Parcels',
                        value: canViewParcel ? (parcelStatus.data?.totals.parcels ?? 0) : '-',
                      },
                      {
                        metric: 'Delivery Success',
                        value: canViewParcel ? formatPercent(deliveryRate) : '-',
                      },
                      {
                        metric: 'Shift Revenue (Net)',
                        value: canViewShiftRevenue
                          ? formatMoneyPsw(shiftRevenue.data?.totals.netPsw)
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
                        metric: 'To-Be-Paid Outstanding',
                        value: canViewOutstanding
                          ? formatMoneyPsw(outstanding.data?.totals.outstandingPsw)
                          : '-',
                      },
                    ]}
                  />

                  <div className="grid gap-3 lg:grid-cols-2">
                    <DashboardBarChartCard
                      title="Top Branch Profit Chart"
                      description="Net profitability ranking for top branches."
                      seriesName="Net Profit (major units)"
                      data={topBranchChartData}
                    />
                    <DashboardDonutChartCard
                      title="Exception Mix Chart"
                      description="Operational exception categories in selected scope."
                      data={exceptionChartData}
                    />
                  </div>

                  <div className="grid gap-3 lg:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Top Branches by Net Profit</CardTitle>
                        <CardDescription>
                          Based on selected date range and branch scope.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        {!topBranches.length ? (
                          <div className="text-muted-foreground">
                            No profitability data for current scope.
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
                        <CardTitle className="text-base">Exception Snapshot</CardTitle>
                        <CardDescription>
                          Operational and cash exception indicators.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Undelivered parcels</span>
                          <span>
                            {canViewParcel
                              ? Math.max(
                                  (deliveryPerformance.data?.totals.deliveries ?? 0) -
                                    (deliveryPerformance.data?.totals.delivered ?? 0),
                                  0,
                                )
                              : '-'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Cash exception lines</span>
                          <span>{canViewCashConfirmations ? cashExceptionCount : '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total shortage</span>
                          <span>
                            {canViewCashConfirmations
                              ? formatMoneyPsw(cashConfirmations.data?.totals.shortagePsw)
                              : '-'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total overage</span>
                          <span>
                            {canViewCashConfirmations
                              ? formatMoneyPsw(cashConfirmations.data?.totals.overagePsw)
                              : '-'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Credit customers</span>
                          <span>
                            {canViewCredit ? (creditExposure.data?.totals.customers ?? 0) : '-'}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </ScrollableWrapper>
      </div>
    </RoleDashboardGuard>
  );
}
