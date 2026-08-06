import { AccountingSetupPermissionKeys, PermissionKeys } from '@/shared/permissions/constants';
import {
  hasRequiredPermissionForPath,
  inferRequiredPermissionByPath,
} from '@/shared/permissions/path-access';
import { inferRequiredModuleByPath } from '@/shared/company-modules/route-modules';
import { ROUTES, type MenuItem } from './navigation';

export type ModuleState = { code: string; isEnabled: boolean };

export type SidebarNode = {
  title: string;
  url?: string;
  icon?: string;
  permissionKey?: string;
  hiddenInSidebar?: boolean;
  items?: SidebarNode[];
  children?: SidebarNode[];
};

export function normalizeModuleRows(payload: unknown): ModuleState[] {
  if (Array.isArray(payload)) return payload as ModuleState[];
  if (
    payload &&
    typeof payload === 'object' &&
    'data' in payload &&
    Array.isArray((payload as { data?: unknown }).data)
  ) {
    return (payload as { data: ModuleState[] }).data;
  }
  return [];
}

function canRenderSidebarNode(node: SidebarNode, allowedPermissions: Set<string>): boolean {
  if (node.hiddenInSidebar) return false;
  if (node.url === '/accounting/setup') {
    const hasLegacySetupAccess =
      allowedPermissions.has(PermissionKeys.CanReadAccountingSetup) ||
      allowedPermissions.has(PermissionKeys.CanCreateAccountingSetup) ||
      allowedPermissions.has(PermissionKeys.CanUpdateAccountingSetup) ||
      allowedPermissions.has(PermissionKeys.CanDeleteAccountingSetup);
    const hasGranularSetupAccess = Object.values(AccountingSetupPermissionKeys).some((scope) =>
      [scope.read, scope.create, scope.update, scope.delete].some((permission) =>
        allowedPermissions.has(permission),
      ),
    );
    return hasLegacySetupAccess || hasGranularSetupAccess;
  }
  const inferredPermissionKey = inferRequiredPermissionByPath(node.url);
  if (inferredPermissionKey) return hasRequiredPermissionForPath(node.url, allowedPermissions);
  if (!node.permissionKey) return true;
  return allowedPermissions.has(node.permissionKey);
}

function filterSidebarTreeByPermissions(
  node: SidebarNode,
  allowedPermissions: Set<string>,
  enabledModules: Set<string>,
): SidebarNode | null {
  const requiredModule = inferRequiredModuleByPath(node.url);
  if (requiredModule && !enabledModules.has(requiredModule)) return null;

  const filteredChildren = (node.children ?? [])
    .map((child) => filterSidebarTreeByPermissions(child, allowedPermissions, enabledModules))
    .filter((child): child is SidebarNode => child !== null);
  const filteredItems = (node.items ?? [])
    .map((item) => filterSidebarTreeByPermissions(item, allowedPermissions, enabledModules))
    .filter((item): item is SidebarNode => item !== null);
  const isDirectlyVisible = canRenderSidebarNode(node, allowedPermissions);
  const hasVisibleDescendant = filteredChildren.length > 0 || filteredItems.length > 0;
  const isContainerNode = Boolean(
    (node.children?.length ?? 0) > 0 || (node.items?.length ?? 0) > 0,
  );

  if (!isDirectlyVisible && !hasVisibleDescendant) return null;
  if (isContainerNode && !hasVisibleDescendant) return null;
  if (!node.url && !hasVisibleDescendant) return null;

  return {
    ...node,
    ...(node.children ? { children: filteredChildren } : {}),
    ...(node.items ? { items: filteredItems } : {}),
  };
}

export function filterRoutesByPermissions(
  routes: typeof ROUTES,
  allowedPermissions: Set<string>,
  enabledModules: Set<string>,
) {
  return routes
    .map((group) => {
      const menu = group.menu
        .map((item) => filterSidebarTreeByPermissions(item, allowedPermissions, enabledModules))
        .filter((item): item is MenuItem => item !== null);
      return { ...group, menu };
    })
    .filter((group) => group.menu.length > 0);
}

export function routeContainsPath(node: SidebarNode, pathname: string): boolean {
  if (node.url === pathname) return true;
  if (node.items?.some((item) => routeContainsPath(item, pathname))) return true;
  if (node.children?.some((child) => routeContainsPath(child, pathname))) return true;
  return false;
}

function replaceDashboardUrlInTree<T extends SidebarNode>(node: T, dashboardUrl: string): T {
  const nextItems = node.items?.map((item) => replaceDashboardUrlInTree(item, dashboardUrl));
  const nextChildren = node.children?.map((child) =>
    replaceDashboardUrlInTree(child, dashboardUrl),
  );
  const nextUrl = node.url === '/dashboard' ? dashboardUrl : node.url;
  return {
    ...node,
    url: nextUrl,
    ...(nextItems ? { items: nextItems } : {}),
    ...(nextChildren ? { children: nextChildren } : {}),
  };
}

export function withDynamicDashboardRoute(routes: typeof ROUTES, dashboardUrl: string) {
  return routes.map((group) => ({
    ...group,
    menu: group.menu.map((item) => replaceDashboardUrlInTree(item, dashboardUrl) as MenuItem),
  }));
}
