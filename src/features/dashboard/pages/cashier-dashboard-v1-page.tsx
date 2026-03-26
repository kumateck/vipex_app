import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PermissionKeys } from '@/shared/permissions/constants';
import { useAuthStore } from '@/stores/auth-store';
import {
  useGetDailyCashConfirmationReportQuery,
  useGetDailyCashierSalesReportQuery,
  useGetShiftRevenueReportQuery,
  useGetToBePaidOutstandingReportQuery,
} from '@/features/reporting/api/reporting.api';
import {
  DashboardScopeFilterBar,
  type DashboardScope,
} from '../components/dashboard-scope-filter-bar';
import { DashboardKpiCard } from '../components/dashboard-kpi-card';
import { DashboardBarChartCard, DashboardDonutChartCard } from '../components/dashboard-charts';
import { DashboardExportActions } from '../components/dashboard-export-actions';
import { RoleDashboardGuard } from '../components/role-dashboard-guard';
import { formatMoneyPsw, isoDate } from '../utils/formatters';

function normalizeStatus(value?: string | null) {
  return (value ?? '').trim().toLowerCase();
}

export function CashierDashboardV1Page() {
  const user = useAuthStore((state) => state.user);
  const permissions = new Set(user?.permissions ?? []);
  const [scope, setScope] = useState<DashboardScope | null>(null);

  const canViewSales = permissions.has(PermissionKeys.CanGetShiftRevenueReport);
  const canViewCash = permissions.has(PermissionKeys.CanReadAccounting);
  const canViewOutstanding = permissions.has(PermissionKeys.CanGetOutstandingToBePaidReport);

  const scopeFrom = scope?.dateRange?.from;
  const scopeTo = scope?.dateRange?.to ?? scope?.dateRange?.from;
  const from = isoDate(scopeFrom);
  const to = isoDate(scopeTo);
  const singleDate = from;
  const branchId = scope?.branchId ?? null;
  const locationId = scope?.locationId ?? null;

  const { data: dailySales, isFetching: isSalesLoading } = useGetDailyCashierSalesReportQuery(
    {
      date: singleDate,
      branchId,
      locationId,
      cashierUserId: user?.id ?? null,
      cashierType: null,
    },
    { skip: !scope || !canViewSales },
  );

  const { data: shiftRevenue, isFetching: isShiftLoading } = useGetShiftRevenueReportQuery(
    {
      from,
      to,
      branchId,
      locationId,
      shiftSessionId: null,
    },
    { skip: !scope || !canViewSales },
  );

  const { data: cashConfirmations, isFetching: isCashLoading } =
    useGetDailyCashConfirmationReportQuery(
      {
        from,
        to,
        branchId,
        status: null,
      },
      { skip: !scope || !canViewCash },
    );

  const { data: outstanding, isFetching: isOutstandingLoading } =
    useGetToBePaidOutstandingReportQuery(
      {
        sourceBranchId: branchId,
        destinationBranchId: null,
        from,
        to,
      },
      { skip: !scope || !canViewOutstanding },
    );

  const shiftSummary = useMemo(() => {
    const rows = shiftRevenue?.rows ?? [];
    const open = rows.filter((row) => normalizeStatus(row.status).includes('open')).length;
    const closed = rows.filter((row) => normalizeStatus(row.status).includes('closed')).length;
    return { open, closed, total: rows.length };
  }, [shiftRevenue?.rows]);

  const mix = dailySales?.paymentModeTotals;
  const isLoading = isSalesLoading || isShiftLoading || isCashLoading || isOutstandingLoading;
  const paymentMixData = [
    { label: 'Cash', value: Number(mix?.cashPsw ?? 0) / 100 },
    { label: 'MTN', value: Number(mix?.mtnPsw ?? 0) / 100 },
    { label: 'Telecel', value: Number(mix?.telecelPsw ?? 0) / 100 },
    { label: 'AirtelTigo', value: Number(mix?.airtelPsw ?? 0) / 100 },
    { label: 'Credit', value: Number(mix?.creditPsw ?? 0) / 100 },
  ];
  const shiftData = [
    { label: 'Open', value: shiftSummary.open },
    { label: 'Closed', value: shiftSummary.closed },
    { label: 'Total', value: shiftSummary.total },
  ];

  return (
    <RoleDashboardGuard role="cashier">
      <div className="w-full p-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Cashier Dashboard</CardTitle>
            <CardDescription>
              Daily collections, payment mix, shift activity, cash variances, and to-be-paid
              exposure.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <DashboardScopeFilterBar onApply={setScope} />

            {!scope ? (
              <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
                Apply scope to load cashier analytics.
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
                  {isLoading ? <Badge>Loading...</Badge> : null}
                </div>

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <DashboardKpiCard
                    label="Collections (Gross)"
                    value={canViewSales ? formatMoneyPsw(dailySales?.totals.grossPsw) : '-'}
                    loading={isLoading}
                  />
                  <DashboardKpiCard
                    label="Collections (Net)"
                    value={canViewSales ? formatMoneyPsw(dailySales?.totals.netPsw) : '-'}
                    loading={isLoading}
                  />
                  <DashboardKpiCard
                    label="Transactions"
                    value={canViewSales ? (dailySales?.totals.transactions ?? 0) : '-'}
                    loading={isLoading}
                  />
                  <DashboardKpiCard
                    label="To-Be-Paid Outstanding"
                    value={
                      canViewOutstanding ? formatMoneyPsw(outstanding?.totals.outstandingPsw) : '-'
                    }
                    loading={isLoading}
                  />
                </div>
                <DashboardExportActions
                  filenamePrefix="cashier-dashboard"
                  disabled={!scope}
                  rows={[
                    {
                      metric: 'Collections (Gross)',
                      value: canViewSales ? formatMoneyPsw(dailySales?.totals.grossPsw) : '-',
                    },
                    {
                      metric: 'Collections (Net)',
                      value: canViewSales ? formatMoneyPsw(dailySales?.totals.netPsw) : '-',
                    },
                    {
                      metric: 'Transactions',
                      value: canViewSales ? (dailySales?.totals.transactions ?? 0) : '-',
                    },
                    {
                      metric: 'To-Be-Paid Outstanding',
                      value: canViewOutstanding
                        ? formatMoneyPsw(outstanding?.totals.outstandingPsw)
                        : '-',
                    },
                  ]}
                />

                <div className="grid gap-3 lg:grid-cols-2">
                  <DashboardDonutChartCard
                    title="Payment Mix Chart"
                    description="Distribution of cashier collections by payment method."
                    data={paymentMixData}
                  />
                  <DashboardBarChartCard
                    title="Shift Session Chart"
                    description="Open/closed session counts for selected scope."
                    seriesName="Sessions"
                    data={shiftData}
                  />
                </div>

                <div className="grid gap-3 lg:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Payment Mix</CardTitle>
                      <CardDescription>
                        Cashier payment mode totals for selected scope.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Cash</span>
                        <span>{canViewSales ? formatMoneyPsw(mix?.cashPsw) : '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>MTN</span>
                        <span>{canViewSales ? formatMoneyPsw(mix?.mtnPsw) : '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Telecel</span>
                        <span>{canViewSales ? formatMoneyPsw(mix?.telecelPsw) : '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>AirtelTigo</span>
                        <span>{canViewSales ? formatMoneyPsw(mix?.airtelPsw) : '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Credit</span>
                        <span>{canViewSales ? formatMoneyPsw(mix?.creditPsw) : '-'}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Shift and Cash Status</CardTitle>
                      <CardDescription>Session state and cash variance indicators.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Open sessions</span>
                        <span>{canViewSales ? shiftSummary.open : '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Closed sessions</span>
                        <span>{canViewSales ? shiftSummary.closed : '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total sessions</span>
                        <span>{canViewSales ? shiftSummary.total : '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Cash shortage</span>
                        <span>
                          {canViewCash
                            ? formatMoneyPsw(cashConfirmations?.totals.shortagePsw)
                            : '-'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Cash overage</span>
                        <span>
                          {canViewCash ? formatMoneyPsw(cashConfirmations?.totals.overagePsw) : '-'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Outstanding parcels</span>
                        <span>{canViewOutstanding ? (outstanding?.totals.parcels ?? 0) : '-'}</span>
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
