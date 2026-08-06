import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DashboardScopeFilterBar,
  type DashboardScope,
} from '../components/dashboard-scope-filter-bar';
import { RoleDashboardGuard } from '../components/role-dashboard-guard';
import type { DashboardRoleKey } from '../utils/role-dashboard';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';

function formatScope(scope: DashboardScope | null) {
  if (!scope) return 'No scope applied yet.';
  const from = scope.dateRange?.from?.toISOString().slice(0, 10) ?? '-';
  const to = scope.dateRange?.to?.toISOString().slice(0, 10) ?? '-';
  return `Branch: ${scope.branchId ?? 'All'} | Location: ${scope.locationId ?? 'All'} | Date: ${from} to ${to}`;
}

export function RoleDashboardPage({
  role,
  title,
  description,
}: {
  role: DashboardRoleKey;
  title: string;
  description: string;
}) {
  const [scope, setScope] = useState<DashboardScope | null>(null);

  return (
    <RoleDashboardGuard role={role}>
      <ScrollableWrapper>
        <div className="w-full p-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <DashboardScopeFilterBar onApply={setScope} />
              <div className="rounded-md border p-3 text-sm text-muted-foreground">
                {formatScope(scope)}
              </div>
              <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
                Widget area for KPIs/charts/tables will be implemented in the next backlog items.
              </div>
            </CardContent>
          </Card>
        </div>
      </ScrollableWrapper>
    </RoleDashboardGuard>
  );
}
