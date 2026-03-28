'use client';

import * as React from 'react';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar';
import { inferRequiredPermissionByPath } from '@/shared/permissions/path-access';
import { useAuthStore } from '@/stores/auth-store';

// import { NavMain } from './nav-main';
import { TeamSwitcher } from './team';
import { NavUser } from './user';
import { ROUTES, type MenuItem } from './navigation';
import { NavMain } from './menu';

type SidebarNode = {
  title: string;
  url?: string;
  permissionKey?: string;
  hiddenInSidebar?: boolean;
  items?: SidebarNode[];
  children?: SidebarNode[];
};

function hasAccountingUrl(node: SidebarNode): boolean {
  if (node.url?.startsWith('/accounting')) return true;
  const descendants = [...(node.items ?? []), ...(node.children ?? [])];
  return descendants.some(hasAccountingUrl);
}

function canRenderSidebarNode(node: SidebarNode, allowedPermissions: Set<string>): boolean {
  if (node.hiddenInSidebar) return false;
  const effectivePermissionKey = node.permissionKey ?? inferRequiredPermissionByPath(node.url);
  if (!effectivePermissionKey) return true;
  return allowedPermissions.has(effectivePermissionKey);
}

function filterSidebarTreeByPermissions(
  node: SidebarNode,
  allowedPermissions: Set<string>,
  accountingEnabled: boolean,
): SidebarNode | null {
  if (!accountingEnabled && hasAccountingUrl(node)) return null;

  const filteredChildren = (node.children ?? [])
    .map((child) => filterSidebarTreeByPermissions(child, allowedPermissions, accountingEnabled))
    .filter((child): child is SidebarNode => child !== null);
  const filteredItems = (node.items ?? [])
    .map((item) => filterSidebarTreeByPermissions(item, allowedPermissions, accountingEnabled))
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
  accountingEnabled: boolean,
) {
  return routes
    .map((group) => {
      const menu = group.menu
        .map((item) => filterSidebarTreeByPermissions(item, allowedPermissions, accountingEnabled))
        .filter((item): item is MenuItem => item !== null);
      return { ...group, menu };
    })
    .filter((group) => group.menu.length > 0);
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const storePermissions = useAuthStore((state) => state.user?.permissions ?? []);
  const accountingEnabled = useAuthStore((state) => state.user?.company?.useAccounting ?? false);

  const allowedPermissions = new Set(storePermissions);
  const filteredRoutes = filterRoutesByPermissions(ROUTES, allowedPermissions, accountingEnabled);

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
