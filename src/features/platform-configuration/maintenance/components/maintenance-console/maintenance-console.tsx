import { useAuthStore } from '@/stores/auth-store';
import NoAccess from '@/components/permissions/no-access';
import { useMaintenanceConsole } from '../../hooks';
import { isSystemAdminRoleName } from '../../utils';
import { MaintenanceView } from './maintenance-view';

function MaintenanceWorkspace() {
  const state = useMaintenanceConsole();
  return <MaintenanceView state={state} />;
}
export function MaintenanceConsolePage() {
  const user = useAuthStore((state) => state.user);
  if (!isSystemAdminRoleName(user?.role?.name)) return <NoAccess />;
  return <MaintenanceWorkspace key={user?.company?.id} />;
}
