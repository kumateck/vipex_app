import type { EntityAuditLog } from '@/features/audit/api';
import { DashboardKpiCard } from '@/features/dashboard/components/dashboard-kpi-card';
import { isHighRiskAuditLog } from '@/features/audit/report-utils';

export function AuditKpiRow({ rows, loading }: { rows: EntityAuditLog[]; loading: boolean }) {
  const userCount = new Set(rows.map((row) => row.actorUserId).filter(Boolean)).size;
  const moduleCount = new Set(rows.map((row) => row.entityType).filter(Boolean)).size;
  const highRiskCount = rows.filter(isHighRiskAuditLog).length;

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <DashboardKpiCard label="Audit Events" value={rows.length} loading={loading} />
      <DashboardKpiCard label="Users Involved" value={userCount} loading={loading} />
      <DashboardKpiCard label="Modules Affected" value={moduleCount} loading={loading} />
      <DashboardKpiCard label="High-Risk Events" value={highRiskCount} loading={loading} />
    </div>
  );
}
