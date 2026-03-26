import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import {
  useGetDeliveryPerformanceReportQuery,
  useGetParcelStatusSummaryReportQuery,
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

export function SecretaryDashboardV1Page() {
  const user = useAuthStore((state) => state.user);
  const permissions = new Set(user?.permissions ?? []);
  const [scope, setScope] = useState<DashboardScope | null>(null);

  const canViewParcels = permissions.has(PermissionKeys.CanGetParcelStatusSummaryReport);
  const canReadParcels = permissions.has(PermissionKeys.CanReadParcels);
  const canViewOutstanding = permissions.has(PermissionKeys.CanGetOutstandingToBePaidReport);

  const scopeFrom = scope?.dateRange?.from;
  const scopeTo = scope?.dateRange?.to ?? scope?.dateRange?.from;
  const from = isoDate(scopeFrom);
  const to = isoDate(scopeTo);
  const branchId = scope?.branchId ?? null;
  const locationId = scope?.locationId ?? null;

  const parcelStatus = useGetParcelStatusSummaryReportQuery(
    { branchId, from, to },
    { skip: !scope || !canViewParcels },
  );
  const deliveryPerformance = useGetDeliveryPerformanceReportQuery(
    { branchId, riderUserId: null, from, to },
    { skip: !scope || !canReadParcels },
  );
  const outstanding = useGetToBePaidOutstandingReportQuery(
    { sourceBranchId: null, destinationBranchId: branchId, from, to },
    { skip: !scope || !canViewOutstanding },
  );

  const loading =
    parcelStatus.isFetching || deliveryPerformance.isFetching || outstanding.isFetching;

  const deliveryRate = useMemo(() => {
    const deliveries = deliveryPerformance.data?.totals.deliveries ?? 0;
    if (!deliveries) return 0;
    return (deliveryPerformance.data?.totals.delivered ?? 0) / deliveries;
  }, [deliveryPerformance.data?.totals.delivered, deliveryPerformance.data?.totals.deliveries]);

  const topDestinations = useMemo(() => {
    const counts = new Map<string, number>();
    for (const row of parcelStatus.data?.rows ?? []) {
      const key = row.destinationBranchName ?? 'Unknown';
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([name, parcels]) => ({ name, parcels }))
      .sort((a, b) => b.parcels - a.parcels)
      .slice(0, 5);
  }, [parcelStatus.data?.rows]);

  const agedParcels = useMemo(() => {
    const rows = outstanding.data?.rows ?? [];
    const now = Date.now();
    return rows.filter((row) => {
      const ageDays = Math.floor((now - new Date(row.createdAt).getTime()) / (1000 * 60 * 60 * 24));
      return ageDays >= 7;
    }).length;
  }, [outstanding.data?.rows]);
  const deliveryStatusData = [
    { label: 'Deliveries', value: deliveryPerformance.data?.totals.deliveries ?? 0 },
    { label: 'Delivered', value: deliveryPerformance.data?.totals.delivered ?? 0 },
    { label: 'Out for Delivery', value: deliveryPerformance.data?.totals.outForDelivery ?? 0 },
    { label: 'Returned', value: deliveryPerformance.data?.totals.returnedToOffice ?? 0 },
  ];
  const destinationMixData = topDestinations.map((item) => ({
    label: item.name,
    value: item.parcels,
  }));

  return (
    <RoleDashboardGuard role="secretary">
      <div className="w-full p-4 space-y-4">
        <ScrollableWrapper>
          <Card>
            <CardHeader>
              <CardTitle>Secretary Dashboard</CardTitle>
              <CardDescription>
                Service desk visibility for destination flow, uncollected parcels, and delivery
                pipeline.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <DashboardScopeFilterBar onApply={setScope} />

              {!scope ? (
                <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
                  Apply scope to load secretary analytics.
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
                      label="Parcels in Scope"
                      value={canViewParcels ? (parcelStatus.data?.totals.parcels ?? 0) : '-'}
                      loading={loading}
                    />
                    <DashboardKpiCard
                      label="Delivery Success"
                      value={canReadParcels ? formatPercent(deliveryRate) : '-'}
                      loading={loading}
                    />
                    <DashboardKpiCard
                      label="Uncollected (Outstanding)"
                      value={canViewOutstanding ? (outstanding.data?.totals.parcels ?? 0) : '-'}
                      loading={loading}
                    />
                    <DashboardKpiCard
                      label="Aged Outstanding (7+ days)"
                      value={canViewOutstanding ? agedParcels : '-'}
                      loading={loading}
                    />
                    <DashboardKpiCard
                      label="Outstanding Value"
                      value={
                        canViewOutstanding
                          ? formatMoneyPsw(outstanding.data?.totals.outstandingPsw)
                          : '-'
                      }
                      loading={loading}
                    />
                    <DashboardKpiCard
                      label="Delivery Fees Collected"
                      value={
                        canReadParcels
                          ? formatMoneyPsw(deliveryPerformance.data?.totals.amountPaidPsw)
                          : '-'
                      }
                      loading={loading}
                    />
                  </div>
                  <DashboardExportActions
                    filenamePrefix="secretary-dashboard"
                    disabled={!scope}
                    rows={[
                      {
                        metric: 'Parcels in Scope',
                        value: canViewParcels ? (parcelStatus.data?.totals.parcels ?? 0) : '-',
                      },
                      {
                        metric: 'Delivery Success',
                        value: canReadParcels ? formatPercent(deliveryRate) : '-',
                      },
                      {
                        metric: 'Uncollected (Outstanding)',
                        value: canViewOutstanding ? (outstanding.data?.totals.parcels ?? 0) : '-',
                      },
                      {
                        metric: 'Aged Outstanding (7+ days)',
                        value: canViewOutstanding ? agedParcels : '-',
                      },
                      {
                        metric: 'Outstanding Value',
                        value: canViewOutstanding
                          ? formatMoneyPsw(outstanding.data?.totals.outstandingPsw)
                          : '-',
                      },
                      {
                        metric: 'Delivery Fees Collected',
                        value: canReadParcels
                          ? formatMoneyPsw(deliveryPerformance.data?.totals.amountPaidPsw)
                          : '-',
                      },
                    ]}
                  />

                  <div className="grid gap-3 lg:grid-cols-2">
                    <DashboardBarChartCard
                      title="Delivery Pipeline Chart"
                      description="Delivery flow counts for current scope."
                      seriesName="Parcels"
                      data={deliveryStatusData}
                    />
                    <DashboardDonutChartCard
                      title="Destination Mix Chart"
                      description="Top destination branches by parcel count."
                      data={destinationMixData}
                    />
                  </div>

                  <div className="grid gap-3 lg:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Top Destinations</CardTitle>
                        <CardDescription>Destination branches by parcel volume.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        {!topDestinations.length ? (
                          <div className="text-muted-foreground">
                            No destination data in current scope.
                          </div>
                        ) : (
                          topDestinations.map((item, index) => (
                            <div key={item.name} className="flex justify-between">
                              <span>
                                {index + 1}. {item.name}
                              </span>
                              <span>{item.parcels}</span>
                            </div>
                          ))
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Service Board Snapshot</CardTitle>
                        <CardDescription>
                          Quick operational view for front-office follow up.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Deliveries</span>
                          <span>
                            {canReadParcels
                              ? (deliveryPerformance.data?.totals.deliveries ?? 0)
                              : '-'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Delivered</span>
                          <span>
                            {canReadParcels
                              ? (deliveryPerformance.data?.totals.delivered ?? 0)
                              : '-'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Out for delivery</span>
                          <span>
                            {canReadParcels
                              ? (deliveryPerformance.data?.totals.outForDelivery ?? 0)
                              : '-'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Returned to office</span>
                          <span>
                            {canReadParcels
                              ? (deliveryPerformance.data?.totals.returnedToOffice ?? 0)
                              : '-'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>To-be-paid planned</span>
                          <span>
                            {canViewOutstanding
                              ? formatMoneyPsw(outstanding.data?.totals.plannedToBePaidPsw)
                              : '-'}
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
