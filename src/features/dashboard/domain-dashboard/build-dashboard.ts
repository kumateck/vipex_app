import type { MainPermissionTab } from '@/shared/permissions/ui-metadata';
import { resolvePrimaryDomain } from './primary-domain';
import { DASHBOARD_WIDGETS } from './widget-registry';
import type { DashboardModel, DashboardUser, DashboardWidget } from './types';

function hasAllRequiredPermissions(userPermissions: Set<string>, widget: DashboardWidget) {
  return widget.requiredPermissions.every((permission) => userPermissions.has(permission));
}

export function buildDashboard(
  user?: DashboardUser | null,
  domainOverride?: MainPermissionTab | null,
): DashboardModel {
  const targetDomain = domainOverride ?? resolvePrimaryDomain(user);
  const userPermissions = new Set(user?.permissions ?? []);

  const widgets = DASHBOARD_WIDGETS.filter(
    (widget) =>
      widget.domain === targetDomain && hasAllRequiredPermissions(userPermissions, widget),
  ).sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));

  return {
    domain: targetDomain,
    widgets,
  };
}
