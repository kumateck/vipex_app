import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { useListAuditLogsQuery } from '@/features/audit/api';
import {
  useGetDailyCashConfirmationReportQuery,
  useGetExpenseByCategoryReportQuery,
  useGetToBePaidCollectionsReconciliationReportQuery,
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

function toDateTimeRange(from: string, to: string) {
  return {
    from: `${from}T00:00:00.000`,
    to: `${to}T23:59:59.999`,
  };
}

export function AuditorDashboardV1Page() {
  const user = useAuthStore((state) => state.user);
  const permissions = new Set(user?.permissions ?? []);
  const [scope, setScope] = useState<DashboardScope | null>(null);

  const canListAudit = permissions.has(PermissionKeys.CanListAuditLogs);
  const canReadAccounting = permissions.has(PermissionKeys.CanReadAccounting);
  const canViewOutstanding = permissions.has(PermissionKeys.CanGetOutstandingToBePaidReport);

  const scopeFrom = scope?.dateRange?.from;
  const scopeTo = scope?.dateRange?.to ?? scope?.dateRange?.from;
  const from = isoDate(scopeFrom);
  const to = isoDate(scopeTo);
  const branchId = scope?.branchId ?? null;
  const locationId = scope?.locationId ?? null;

  const auditLogs = useListAuditLogsQuery(
    {
      page: 1,
      pageSize: 200,
      filters: {
        from: toDateTimeRange(from, to).from,
        to: toDateTimeRange(from, to).to,
      },
    },
    { skip: !scope || !canListAudit },
  );

  const cashConfirmations = useGetDailyCashConfirmationReportQuery(
    { from, to, branchId, status: null },
    { skip: !scope || !canReadAccounting },
  );

  const expenseByCategory = useGetExpenseByCategoryReportQuery(
    { from, to, branchId, status: null },
    { skip: !scope || !canReadAccounting },
  );

  const toBePaidReconciliation = useGetToBePaidCollectionsReconciliationReportQuery(
    { sourceBranchId: null, destinationBranchId: branchId, from, to },
    { skip: !scope || !canViewOutstanding },
  );

  const loading =
    auditLogs.isFetching ||
    cashConfirmations.isFetching ||
    expenseByCategory.isFetching ||
    toBePaidReconciliation.isFetching;

  const suspiciousCount = useMemo(() => {
    const rows = auditLogs.data?.data ?? [];
    return rows.filter((row) => {
      const searchable = `${row.action} ${row.message ?? ''}`.toLowerCase();
      return (
        searchable.includes('suspicious') ||
        searchable.includes('override') ||
        searchable.includes('failed') ||
        searchable.includes('reject')
      );
    }).length;
  }, [auditLogs.data?.data]);

  const deletedCount = useMemo(() => {
    const rows = auditLogs.data?.data ?? [];
    return rows.filter((row) => row.action.toLowerCase().includes('delete')).length;
  }, [auditLogs.data?.data]);

  const highRiskLogs = useMemo(() => {
    const rows = auditLogs.data?.data ?? [];
    return rows
      .filter((row) => {
        const searchable = `${row.action} ${row.message ?? ''}`.toLowerCase();
        return (
          searchable.includes('delete') ||
          searchable.includes('override') ||
          searchable.includes('reject') ||
          searchable.includes('suspicious')
        );
      })
      .slice(0, 8);
  }, [auditLogs.data?.data]);
  const auditSignalData = [
    { label: 'Suspicious', value: suspiciousCount },
    { label: 'Deleted', value: deletedCount },
    { label: 'Events', value: auditLogs.data?.meta.totalRecords ?? 0 },
  ];
  const financialRiskMixData = [
    {
      label: 'Shortage',
      value: Math.round(Number(cashConfirmations.data?.totals.shortagePsw ?? 0) / 100),
    },
    {
      label: 'Overage',
      value: Math.round(Number(cashConfirmations.data?.totals.overagePsw ?? 0) / 100),
    },
    {
      label: 'Reconciliation Variance',
      value: Math.round(Number(toBePaidReconciliation.data?.totals.variancePsw ?? 0) / 100),
    },
  ];

  return (
    <RoleDashboardGuard role="auditor">
      <div className="w-full p-4 space-y-4">
        <ScrollableWrapper>
          <Card>
            <CardHeader>
              <CardTitle>Auditor Dashboard</CardTitle>
              <CardDescription>
                Governance analytics across audit trail activity, cash variance, expenses, and
                reconciliation.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <DashboardScopeFilterBar onApply={setScope} />

              {!scope ? (
                <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
                  Apply scope to load auditor analytics.
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
                      label="Suspicious Actions"
                      value={canListAudit ? suspiciousCount : '-'}
                      loading={loading}
                    />
                    <DashboardKpiCard
                      label="Deleted Actions"
                      value={canListAudit ? deletedCount : '-'}
                      loading={loading}
                    />
                    <DashboardKpiCard
                      label="Audit Events"
                      value={canListAudit ? (auditLogs.data?.meta.totalRecords ?? 0) : '-'}
                      loading={loading}
                    />
                    <DashboardKpiCard
                      label="Cash Variance (Abs)"
                      value={
                        canReadAccounting
                          ? formatMoneyPsw(
                              Math.abs(cashConfirmations.data?.totals.shortagePsw ?? 0) +
                                Math.abs(cashConfirmations.data?.totals.overagePsw ?? 0),
                            )
                          : '-'
                      }
                      loading={loading}
                    />
                    <DashboardKpiCard
                      label="Expense Posted"
                      value={
                        canReadAccounting
                          ? formatMoneyPsw(expenseByCategory.data?.totals.postedPsw)
                          : '-'
                      }
                      loading={loading}
                    />
                    <DashboardKpiCard
                      label="Reconciliation Variance"
                      value={
                        canViewOutstanding
                          ? formatMoneyPsw(toBePaidReconciliation.data?.totals.variancePsw)
                          : '-'
                      }
                      loading={loading}
                    />
                  </div>
                  <DashboardExportActions
                    filenamePrefix="auditor-dashboard"
                    disabled={!scope}
                    rows={[
                      { metric: 'Suspicious Actions', value: canListAudit ? suspiciousCount : '-' },
                      { metric: 'Deleted Actions', value: canListAudit ? deletedCount : '-' },
                      {
                        metric: 'Audit Events',
                        value: canListAudit ? (auditLogs.data?.meta.totalRecords ?? 0) : '-',
                      },
                      {
                        metric: 'Cash Variance (Abs)',
                        value: canReadAccounting
                          ? formatMoneyPsw(
                              Math.abs(cashConfirmations.data?.totals.shortagePsw ?? 0) +
                                Math.abs(cashConfirmations.data?.totals.overagePsw ?? 0),
                            )
                          : '-',
                      },
                      {
                        metric: 'Expense Posted',
                        value: canReadAccounting
                          ? formatMoneyPsw(expenseByCategory.data?.totals.postedPsw)
                          : '-',
                      },
                      {
                        metric: 'Reconciliation Variance',
                        value: canViewOutstanding
                          ? formatMoneyPsw(toBePaidReconciliation.data?.totals.variancePsw)
                          : '-',
                      },
                    ]}
                  />

                  <div className="grid gap-3 lg:grid-cols-2">
                    <DashboardBarChartCard
                      title="Audit Signals Chart"
                      description="Volume of key audit signal categories."
                      seriesName="Count"
                      data={auditSignalData}
                    />
                    <DashboardDonutChartCard
                      title="Financial Risk Mix Chart"
                      description="Shortage, overage, and reconciliation variance mix."
                      data={financialRiskMixData}
                    />
                  </div>

                  <div className="grid gap-3 lg:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Cash and Expense Exceptions</CardTitle>
                        <CardDescription>
                          Cross-check indicators from accounting control reports.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Cash shortage</span>
                          <span>
                            {canReadAccounting
                              ? formatMoneyPsw(cashConfirmations.data?.totals.shortagePsw)
                              : '-'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Cash overage</span>
                          <span>
                            {canReadAccounting
                              ? formatMoneyPsw(cashConfirmations.data?.totals.overagePsw)
                              : '-'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Expense requests</span>
                          <span>
                            {canReadAccounting
                              ? (expenseByCategory.data?.totals.requests ?? 0)
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
                          <span>To-be-paid variance lines</span>
                          <span>
                            {canViewOutstanding
                              ? (toBePaidReconciliation.data?.totals.parcels ?? 0)
                              : '-'}
                          </span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Recent High-Risk Audit Events</CardTitle>
                        <CardDescription>
                          Latest high-risk events based on action/message heuristics.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        {!highRiskLogs.length ? (
                          <div className="text-muted-foreground">
                            No high-risk events for current scope.
                          </div>
                        ) : (
                          highRiskLogs.map((row) => (
                            <div key={row.id} className="rounded-md border p-2">
                              <div className="font-medium">{row.action}</div>
                              <div className="text-muted-foreground">{row.message ?? '-'}</div>
                              <div className="text-xs text-muted-foreground">
                                {new Date(row.createdAt).toLocaleString()}
                              </div>
                            </div>
                          ))
                        )}
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
