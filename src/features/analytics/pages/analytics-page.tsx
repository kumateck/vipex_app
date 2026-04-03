import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/stores/auth-store';
import { AnalyticsFilters } from '../components/analytics-filters';
import {
  BranchAnalyticsModule,
  DefaultAnalyticsModule,
  ExecutiveAnalyticsModule,
  FinancialAnalyticsModule,
  OperationalAnalyticsModule,
  PersonalAnalyticsModule,
} from '../modules';
import { getMockAnalyticsSnapshot } from '../api/mock-data';
import { ANALYTICS_PERMISSION_KEYS, hasAnalyticsPermission } from '../permissions';
import { ANALYTICS_ALL, type AnalyticsResolvedScope } from '../types';
import { resolveAnalyticsScope } from '../utils/scope';

function scopeBadge(scope: AnalyticsResolvedScope) {
  return [
    `Branch: ${scope.branchId ?? ANALYTICS_ALL}`,
    `Location: ${scope.locationId ?? ANALYTICS_ALL}`,
    `Range: ${scope.dateRange ?? 'today'}`,
  ];
}

export function AnalyticsPage() {
  const user = useAuthStore((state) => state.user);
  const [scope, setScope] = useState<AnalyticsResolvedScope>(() =>
    resolveAnalyticsScope({
      user,
      selectedBranchId: ANALYTICS_ALL,
      selectedLocationId: ANALYTICS_ALL,
      dateRange: 'today',
    }),
  );
  const [isLoading, setIsLoading] = useState(false);

  const permissions = user?.permissions ?? [];
  const hasBasic =
    hasAnalyticsPermission(permissions, ANALYTICS_PERMISSION_KEYS.basic) ||
    permissions.includes('CanReadDashboard');
  const canViewOperational = hasAnalyticsPermission(
    permissions,
    ANALYTICS_PERMISSION_KEYS.operational,
  );
  const canViewFinancial = hasAnalyticsPermission(permissions, ANALYTICS_PERMISSION_KEYS.financial);
  const canViewBranch = hasAnalyticsPermission(permissions, ANALYTICS_PERMISSION_KEYS.branch);
  const canViewGlobal = hasAnalyticsPermission(permissions, ANALYTICS_PERMISSION_KEYS.global);
  const canViewPersonal = hasAnalyticsPermission(permissions, ANALYTICS_PERMISSION_KEYS.personal);

  const data = getMockAnalyticsSnapshot(scope);

  return (
    <div className="w-full p-4 space-y-4">
      <ScrollableWrapper>
        <Card>
          <CardHeader>
            <CardTitle>Analytics Dashboard</CardTitle>
            <CardDescription>
              Role-based and scope-aware operational analytics using company access policy.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <AnalyticsFilters
              onApply={(nextScope) => {
                setIsLoading(true);
                setScope(nextScope);
                window.setTimeout(() => setIsLoading(false), 300);
              }}
            />

            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {scopeBadge(scope).map((text) => (
                <Badge key={text} variant="secondary">
                  {text}
                </Badge>
              ))}
              <Badge variant="outline">Scope: {scope.meta.mode}</Badge>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-64 w-full" />
              </div>
            ) : (
              <div className="space-y-6">
                {hasBasic ? <DefaultAnalyticsModule data={data.default} /> : null}

                {canViewOperational ? <OperationalAnalyticsModule data={data.operational} /> : null}
                {canViewFinancial ? <FinancialAnalyticsModule data={data.financial} /> : null}
                {canViewBranch ? <BranchAnalyticsModule data={data.branch} /> : null}
                {canViewGlobal ? <ExecutiveAnalyticsModule data={data.executive} /> : null}
                {canViewPersonal ? <PersonalAnalyticsModule data={data.personal} /> : null}

                {!hasBasic &&
                !canViewOperational &&
                !canViewFinancial &&
                !canViewBranch &&
                !canViewGlobal &&
                !canViewPersonal ? (
                  <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
                    No analytics modules available for your account permissions.
                  </div>
                ) : null}
              </div>
            )}
          </CardContent>
        </Card>
      </ScrollableWrapper>
    </div>
  );
}
