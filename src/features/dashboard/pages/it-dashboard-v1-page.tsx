import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useListAuditLogsQuery } from '@/features/audit/api';
import { useListCompanyModulesQuery } from '@/features/company-modules/api';
import type { CompanyModuleRow } from '@/features/company-modules/api';
import { useListRolesQuery } from '@/features/rbac/api/rbac.api';
import { useListUsersQuery } from '@/features/users/api/users.api';
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
import { isoDate } from '../utils/formatters';

function toDateTimeRange(from: string, to: string) {
  return {
    from: `${from}T00:00:00.000`,
    to: `${to}T23:59:59.999`,
  };
}

export function ITDashboardV1Page() {
  const user = useAuthStore((state) => state.user);
  const permissions = new Set(user?.permissions ?? []);
  const [scope, setScope] = useState<DashboardScope | null>(null);

  const canListAudit = permissions.has(PermissionKeys.CanListAuditLogs);
  const canReadUsers = permissions.has(PermissionKeys.CanReadUsers);
  const canReadRoles = permissions.has(PermissionKeys.CanReadRoles);
  const canManageModules = permissions.has(PermissionKeys.CanManageCompanyModules);

  const scopeFrom = scope?.dateRange?.from;
  const scopeTo = scope?.dateRange?.to ?? scope?.dateRange?.from;
  const from = isoDate(scopeFrom);
  const to = isoDate(scopeTo);
  const branchId = scope?.branchId ?? null;
  const locationId = scope?.locationId ?? null;
  const dateRange = toDateTimeRange(from, to);

  const auditLogs = useListAuditLogsQuery(
    {
      page: 1,
      pageSize: 200,
      filters: { from: dateRange.from, to: dateRange.to },
    },
    { skip: !scope || !canListAudit },
  );

  const roles = useListRolesQuery(
    {
      page: 1,
      pageSize: 100,
      filters: { companyId: user?.company?.id ?? null, includeDeleted: false },
    },
    { skip: !scope || !canReadRoles },
  );

  const users = useListUsersQuery(
    {
      page: 1,
      pageSize: 100,
      filters: { companyId: user?.company?.id ?? null },
    },
    { skip: !scope || !canReadUsers },
  );

  const modules = useListCompanyModulesQuery(undefined, { skip: !scope || !canManageModules });

  const moduleRows: CompanyModuleRow[] = useMemo(() => modules.data ?? [], [modules.data]);

  const loading =
    auditLogs.isFetching || roles.isFetching || users.isFetching || modules.isFetching;

  const rolePermissionChanges = useMemo(() => {
    const rows = auditLogs.data?.data ?? [];
    return rows.filter((row) => {
      const searchable = `${row.entityType} ${row.action} ${row.message ?? ''}`.toLowerCase();
      return (
        searchable.includes('role') ||
        searchable.includes('permission') ||
        searchable.includes('rbac')
      );
    }).length;
  }, [auditLogs.data?.data]);

  const moduleChanges = useMemo(() => {
    const rows = auditLogs.data?.data ?? [];
    return rows.filter((row) => {
      const searchable = `${row.entityType} ${row.action} ${row.message ?? ''}`.toLowerCase();
      return searchable.includes('module') || searchable.includes('companymodule');
    }).length;
  }, [auditLogs.data?.data]);

  const securitySignals = useMemo(() => {
    const rows = auditLogs.data?.data ?? [];
    return rows.filter((row) => {
      const searchable = `${row.action} ${row.message ?? ''}`.toLowerCase();
      return (
        searchable.includes('login') ||
        searchable.includes('password') ||
        searchable.includes('token') ||
        searchable.includes('unauthorized') ||
        searchable.includes('forbidden')
      );
    }).length;
  }, [auditLogs.data?.data]);

  const recentTechEvents = useMemo(() => {
    const rows = auditLogs.data?.data ?? [];
    return rows
      .filter((row) => {
        const searchable = `${row.entityType} ${row.action} ${row.message ?? ''}`.toLowerCase();
        return (
          searchable.includes('role') ||
          searchable.includes('permission') ||
          searchable.includes('module') ||
          searchable.includes('user')
        );
      })
      .slice(0, 8);
  }, [auditLogs.data?.data]);
  const securityActivityData = [
    { label: 'Audit Events', value: auditLogs.data?.meta.totalRecords ?? 0 },
    { label: 'Role/Perm Changes', value: rolePermissionChanges },
    { label: 'Module Changes', value: moduleChanges },
    { label: 'Security Signals', value: securitySignals },
  ];
  const moduleStateData = [
    { label: 'Enabled', value: moduleRows.filter((module) => module.isEnabled).length },
    { label: 'Disabled', value: moduleRows.filter((module) => !module.isEnabled).length },
    { label: 'Core', value: moduleRows.filter((module) => module.isCore).length },
  ];

  return (
    <RoleDashboardGuard role="it">
      <div className="w-full p-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>IT Dashboard</CardTitle>
            <CardDescription>
              Platform governance analytics for access changes, module state, and security-sensitive
              activity.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <DashboardScopeFilterBar onApply={setScope} />

            {!scope ? (
              <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
                Apply scope to load IT analytics.
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
                    label="Audit Events"
                    value={canListAudit ? (auditLogs.data?.meta.totalRecords ?? 0) : '-'}
                    loading={loading}
                  />
                  <DashboardKpiCard
                    label="Role/Permission Changes"
                    value={canListAudit ? rolePermissionChanges : '-'}
                    loading={loading}
                  />
                  <DashboardKpiCard
                    label="Module Changes"
                    value={canListAudit ? moduleChanges : '-'}
                    loading={loading}
                  />
                  <DashboardKpiCard
                    label="Security Signals"
                    value={canListAudit ? securitySignals : '-'}
                    loading={loading}
                  />
                  <DashboardKpiCard
                    label="Active Users (sampled)"
                    value={canReadUsers ? (users.data?.meta.totalRecords ?? 0) : '-'}
                    loading={loading}
                  />
                  <DashboardKpiCard
                    label="Roles"
                    value={canReadRoles ? (roles.data?.meta.totalRecords ?? 0) : '-'}
                    loading={loading}
                  />
                </div>
                <DashboardExportActions
                  filenamePrefix="it-dashboard"
                  disabled={!scope}
                  rows={[
                    {
                      metric: 'Audit Events',
                      value: canListAudit ? (auditLogs.data?.meta.totalRecords ?? 0) : '-',
                    },
                    {
                      metric: 'Role/Permission Changes',
                      value: canListAudit ? rolePermissionChanges : '-',
                    },
                    { metric: 'Module Changes', value: canListAudit ? moduleChanges : '-' },
                    { metric: 'Security Signals', value: canListAudit ? securitySignals : '-' },
                    {
                      metric: 'Active Users (sampled)',
                      value: canReadUsers ? (users.data?.meta.totalRecords ?? 0) : '-',
                    },
                    {
                      metric: 'Roles',
                      value: canReadRoles ? (roles.data?.meta.totalRecords ?? 0) : '-',
                    },
                  ]}
                />

                <div className="grid gap-3 lg:grid-cols-2">
                  <DashboardBarChartCard
                    title="Security Activity Chart"
                    description="Key IT governance activity counts."
                    seriesName="Events"
                    data={securityActivityData}
                  />
                  <DashboardDonutChartCard
                    title="Module State Chart"
                    description="Enabled/disabled/core module composition."
                    data={moduleStateData}
                  />
                </div>

                <div className="grid gap-3 lg:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Access and Module State</CardTitle>
                      <CardDescription>
                        Current control-plane state in selected scope window.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Users loaded</span>
                        <span>{canReadUsers ? (users.data?.data.length ?? 0) : '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Roles loaded</span>
                        <span>{canReadRoles ? (roles.data?.data.length ?? 0) : '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Enabled modules</span>
                        <span>
                          {canManageModules
                            ? moduleRows.filter((module) => module.isEnabled).length
                            : '-'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Disabled modules</span>
                        <span>
                          {canManageModules
                            ? moduleRows.filter((module) => !module.isEnabled).length
                            : '-'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Core modules</span>
                        <span>
                          {canManageModules
                            ? moduleRows.filter((module) => module.isCore).length
                            : '-'}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Recent Tech Audit Events</CardTitle>
                      <CardDescription>
                        Latest user, role, permission, and module related events.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      {!recentTechEvents.length ? (
                        <div className="text-muted-foreground">
                          No technical audit events for current scope.
                        </div>
                      ) : (
                        recentTechEvents.map((row) => (
                          <div key={row.id} className="rounded-md border p-2">
                            <div className="font-medium">
                              {row.entityType} • {row.action}
                            </div>
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
      </div>
    </RoleDashboardGuard>
  );
}
