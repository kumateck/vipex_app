import type { ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/stores/auth-store';
import type { DashboardRoleKey } from '../utils/role-dashboard';
import { DASHBOARD_ROLE_LABELS, resolveDashboardRoleKey } from '../utils/role-dashboard';

export function RoleDashboardGuard({
  role,
  children,
}: {
  role: DashboardRoleKey;
  children: ReactNode;
}) {
  const user = useAuthStore((state) => state.user);
  const actualRoleKey = resolveDashboardRoleKey(user?.role?.name);

  if (actualRoleKey !== role) {
    return (
      <div className="w-full p-4">
        <Card>
          <CardHeader>
            <CardTitle>{DASHBOARD_ROLE_LABELS[role]}</CardTitle>
            <CardDescription>
              Your account role does not currently include access to this dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Signed in role: {user?.role?.name ?? 'Unknown'}
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
