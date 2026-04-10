import {
  MAIN_PERMISSION_TABS,
  PermissionUiCatalog,
  type MainPermissionTab,
} from '@/shared/permissions/ui-metadata';
import type { DashboardUser } from './types';

const PREFERRED_DOMAIN_KEY = 'vipex-preferred-dashboard-domain';

function isMainPermissionTab(value: string): value is MainPermissionTab {
  return MAIN_PERMISSION_TABS.includes(value as MainPermissionTab);
}

function getExplicitUserPreference(userId?: string | null): MainPermissionTab | null {
  if (!userId || typeof window === 'undefined') return null;
  const raw = localStorage.getItem(`${PREFERRED_DOMAIN_KEY}:${userId}`);
  if (!raw) return null;
  return isMainPermissionTab(raw) ? raw : null;
}

function getRoleDefaultDomain(user: DashboardUser): MainPermissionTab | null {
  const defaultDomain = user.role?.defaultDomain;
  if (!defaultDomain) return null;
  return isMainPermissionTab(defaultDomain) ? defaultDomain : null;
}

function getHighestPermissionDomain(permissions: string[]): MainPermissionTab {
  if (!permissions.length) return 'Operations';

  const permissionSet = new Set(permissions);
  const counts = new Map<MainPermissionTab, number>(
    MAIN_PERMISSION_TABS.map((domain) => [domain, 0]),
  );

  for (const permission of PermissionUiCatalog) {
    if (!permissionSet.has(permission.key)) continue;
    counts.set(permission.domain, (counts.get(permission.domain) ?? 0) + 1);
  }

  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'Operations';
}

export function resolvePrimaryDomain(user?: DashboardUser | null): MainPermissionTab {
  if (!user) return 'Operations';

  const explicitUserSetting =
    user.preferredDashboardDomain && isMainPermissionTab(user.preferredDashboardDomain)
      ? user.preferredDashboardDomain
      : getExplicitUserPreference(user.id);
  if (explicitUserSetting) return explicitUserSetting;

  const roleDefaultDomain = getRoleDefaultDomain(user);
  if (roleDefaultDomain) return roleDefaultDomain;

  return getHighestPermissionDomain(user.permissions ?? []);
}

export function setPreferredDashboardDomain(userId: string, domain: MainPermissionTab) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`${PREFERRED_DOMAIN_KEY}:${userId}`, domain);
}
