import type { MainPermissionTab } from '@/shared/permissions/ui-metadata';
import { useAuthStore } from '@/stores/auth-store';
import { buildDashboard } from '../build-dashboard';
import { DomainDashboardView } from '../components/domain-dashboard-view';

export function DomainDashboardPage({ domain }: { domain: MainPermissionTab }) {
  const user = useAuthStore((state) => state.user);
  const model = buildDashboard(user, domain);

  return (
    <DomainDashboardView
      isLoading={!user}
      model={model}
      userPermissions={user?.permissions ?? []}
    />
  );
}
