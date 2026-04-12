import type { MainPermissionTab } from '@/shared/permissions/ui-metadata';
import type { AuthUser } from '@/stores/auth-store';

export type DomainSlug =
  | 'operations'
  | 'commercial'
  | 'finance'
  | 'supply-chain'
  | 'human-capital'
  | 'technology'
  | 'governance'
  | 'insights';

export type DashboardWidget = {
  id: string;
  title: string;
  domain: MainPermissionTab;
  subdomain: string;
  module: string;
  requiredPermissions: string[];
  priority?: number;
  route: string;
  description?: string;
};

export type DashboardModel = {
  domain: MainPermissionTab;
  widgets: DashboardWidget[];
};

export type DashboardUser = AuthUser & {
  preferredDashboardDomain?: MainPermissionTab | null;
  role?: (AuthUser['role'] & { defaultDomain?: MainPermissionTab | null }) | null;
};
