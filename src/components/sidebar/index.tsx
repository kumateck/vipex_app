'use client';

import * as React from 'react';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar';
import { useAuthStore } from '@/stores/auth-store';
import { useGetCurrentUserReadOnlyPermissionsQuery } from '@/features/auth/api';

// import { NavMain } from './nav-main';
import { TeamSwitcher } from './team';
import { NavUser } from './user';
import { ROUTES } from './navigation';
import { NavMain } from './menu';

function filterRoutesByPermissions(
  routes: typeof ROUTES,
  allowedPermissions: Set<string>,
  accountingEnabled: boolean,
) {
  return routes
    .map((group) => ({
      ...group,
      menu: group.menu
        .map((item) => {
          const containsAccounting =
            item.url?.startsWith('/accounting') ||
            item.items?.some((subItem) => subItem.url?.startsWith('/accounting'));
          if (containsAccounting && !accountingEnabled) return null;

          const directAllowed = !item.permissionKey || allowedPermissions.has(item.permissionKey);
          const childItems = (item.items ?? []).filter(
            (subItem) =>
              (!subItem.permissionKey || allowedPermissions.has(subItem.permissionKey)) &&
              (accountingEnabled || !subItem.url?.startsWith('/accounting')),
          );

          if (item.items?.length) {
            if (!childItems.length) return null;
            return { ...item, items: childItems };
          }

          return directAllowed ? item : null;
        })
        .filter((item): item is NonNullable<typeof item> => item !== null),
    }))
    .filter((group) => group.menu.length > 0);
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const storePermissions = useAuthStore((state) => state.user?.permissions ?? []);
  const accountingEnabled = useAuthStore((state) => state.user?.company?.useAccounting ?? false);
  const { data: sidebarPermissions } = useGetCurrentUserReadOnlyPermissionsQuery(undefined, {
    skip: !isAuthenticated,
  });

  const allowedPermissions = new Set(sidebarPermissions?.readOnlyPermissions ?? storePermissions);
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
