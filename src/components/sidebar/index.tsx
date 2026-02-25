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
) {
  return routes
    .map((group) => ({
      ...group,
      menu: group.menu
        .map((item) => {
          const directAllowed = !item.permissionKey || allowedPermissions.has(item.permissionKey);
          const childItems = (item.items ?? []).filter(
            (subItem) => !subItem.permissionKey || allowedPermissions.has(subItem.permissionKey),
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
  const { data: sidebarPermissions } = useGetCurrentUserReadOnlyPermissionsQuery(undefined, {
    skip: !isAuthenticated,
  });

  const allowedPermissions = new Set(sidebarPermissions?.readOnlyPermissions ?? storePermissions);
  const filteredRoutes = filterRoutesByPermissions(ROUTES, allowedPermissions);

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
