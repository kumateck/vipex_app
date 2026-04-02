'use client';

import * as React from 'react';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar';
import { AccountingSetupPermissionKeys, PermissionKeys } from '@/shared/permissions/constants';
import { inferRequiredPermissionByPath } from '@/shared/permissions/path-access';
import { useAuthStore } from '@/stores/auth-store';
import { useListCompanyModulesQuery } from '@/features/company-modules/api';
import { inferRequiredModuleByPath } from '@/shared/company-modules/route-modules';

// import { NavMain } from './nav-main';
import { TeamSwitcher } from './team';
import { NavUser } from './user';
import { ROUTES, type MenuItem } from './navigation';
import { NavMain } from './menu';

type ModuleState = { code: string; isEnabled: boolean };

function normalizeModuleRows(payload: unknown): ModuleState[] {
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

type SidebarNode = {
  title: string;
  url?: string;
  permissionKey?: string;
  hiddenInSidebar?: boolean;
  items?: SidebarNode[];
  children?: SidebarNode[];
};

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
  const effectivePermissionKey = node.permissionKey ?? inferRequiredPermissionByPath(node.url);
  if (!effectivePermissionKey) return true;
  return allowedPermissions.has(effectivePermissionKey);
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

  // For container group nodes with explicit permission key (e.g. Sending/Receiving),
  // require that permission regardless of descendant permissions.
  if (isContainerNode && !node.url && node.permissionKey && !isDirectlyVisible) return null;

  if (!isDirectlyVisible && !hasVisibleDescendant) return null;
  if (isContainerNode && !hasVisibleDescendant) return null;
  if (!node.url && !hasVisibleDescendant) return null;
  return {
    ...node,
    ...(node.children ? { children: filteredChildren } : {}),
    ...(node.items ? { items: filteredItems } : {}),
  };
}

function filterRoutesByPermissions(
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

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const storePermissions = useAuthStore((state) => state.user?.permissions ?? []);
  const companyAccountingEnabled = useAuthStore(
    (state) => state.user?.company?.useAccounting ?? false,
  );
  const { data: companyModules } = useListCompanyModulesQuery();
  const enabledModules = React.useMemo(() => {
    const rows = normalizeModuleRows(companyModules);
    const modules = new Set(rows.filter((module) => module.isEnabled).map((module) => module.code));
    if (companyAccountingEnabled) modules.add('accounting');
    return modules;
  }, [companyAccountingEnabled, companyModules]);

  const allowedPermissions = new Set(storePermissions);
  const filteredRoutes = filterRoutesByPermissions(ROUTES, allowedPermissions, enabledModules);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher />
      </SidebarHeader>
      <SidebarContent>
        {filteredRoutes.map((group, idx) => (
          <NavMain key={idx} title={group.title} items={group.menu} />
        ))}
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
