'use client';

import * as React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Icon, type LucideIconProps } from '@/components/ui/icon';
import { Sidebar, SidebarContent, SidebarHeader, SidebarRail } from '@/components/ui/sidebar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import appLogo from '@/assets/logo.png';
import { useListCompanyModulesQuery } from '@/features/company-modules/api';
import { CommunicationSidebarPanel } from '@/features/communication/components/communication-sidebar';
import { HelpSidebarPanel } from '@/features/help/user-manual/components/help-sidebar';
import {
  dashboardPathForDomain,
  resolvePrimaryDomain,
} from '@/features/dashboard/domain-dashboard';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';
import { UserProfile } from '../user-profile';
import { NavMain } from './menu';
import { ROUTES, type MenuItem } from './navigation';
import {
  filterRoutesByPermissions,
  normalizeModuleRows,
  routeContainsPath,
  withDynamicDashboardRoute,
} from './sidebar-permissions';

const TAB_ICON_MAP: Record<string, LucideIconProps> = {
  Workspace: 'LayoutGrid',
  Operations: 'Package',
  Commercial: 'Megaphone',
  Finance: 'Wallet',
  'Supply Chain': 'Boxes',
  'Human Capital': 'UsersRound',
  Technology: 'Cpu',
  Governance: 'ShieldCheck',
  Insights: 'ChartBar',
};

type SidebarIconGroup = {
  id: string;
  title: string;
  menu: MenuItem[];
  iconName: LucideIconProps;
  isCommunication?: boolean;
  isHelp?: boolean;
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const location = useLocation();
  const navigate = useNavigate();
  const storePermissions = useAuthStore((state) => state.user?.permissions ?? []);
  const user = useAuthStore((state) => state.user);
  const companyAccountingEnabled = useAuthStore(
    (state) => state.user?.company?.useAccounting ?? false,
  );
  const { data: companyModules } = useListCompanyModulesQuery();

  const enabledModules = React.useMemo(() => {
    const rows = normalizeModuleRows(companyModules);
    const modules = new Set<string>();
    for (const module of rows) {
      if (module.isEnabled) modules.add(module.code);
    }
    if (companyAccountingEnabled) modules.add('accounting');
    return modules;
  }, [companyAccountingEnabled, companyModules]);

  const allowedPermissions = new Set(storePermissions);
  const dashboardUrl = dashboardPathForDomain(resolvePrimaryDomain(user));
  const routesWithDashboard = withDynamicDashboardRoute(ROUTES, dashboardUrl);
  const filteredRoutes = filterRoutesByPermissions(
    routesWithDashboard,
    allowedPermissions,
    enabledModules,
  );

  const workspaceGroup = filteredRoutes.find((group) => group.title === 'Workspace');
  const hasCommunicationMenu = Boolean(
    workspaceGroup?.menu.some((item) => item.title === 'Internal Communication'),
  );
  const hasHelpMenu = Boolean(workspaceGroup?.menu.some((item) => item.title === 'Help Center'));

  const iconGroups = React.useMemo<SidebarIconGroup[]>(
    () =>
      filteredRoutes.flatMap((group) => {
        const baseGroup: SidebarIconGroup = {
          id: group.title,
          title: group.title,
          menu: group.menu,
          iconName: TAB_ICON_MAP[group.title] ?? 'LayoutGrid',
        };

        if (group.title !== 'Workspace') return [baseGroup];

        const workspaceIconGroups: SidebarIconGroup[] = [
          {
            ...baseGroup,
            menu: group.menu.filter(
              (item) => item.title !== 'Internal Communication' && item.title !== 'Help Center',
            ),
          },
        ];
        if (hasCommunicationMenu) {
          workspaceIconGroups.push({
            id: 'Internal Communication',
            title: 'Chats',
            menu: [],
            iconName: 'MessageSquare',
            isCommunication: true,
          });
        }
        if (hasHelpMenu) {
          workspaceIconGroups.push({
            id: 'Help Center',
            title: 'Help',
            menu: [],
            iconName: 'CircleQuestionMark',
            isHelp: true,
          });
        }
        return workspaceIconGroups;
      }),
    [filteredRoutes, hasCommunicationMenu, hasHelpMenu],
  );

  const [activeGroupId, setActiveGroupId] = React.useState<string>('');
  const [communicationTab, setCommunicationTab] = React.useState<
    'chats' | 'channels' | 'colleagues' | 'requests'
  >('chats');

  React.useEffect(() => {
    if (!iconGroups.length) {
      setActiveGroupId('');
      return;
    }

    setActiveGroupId((current) => {
      const currentExists = current && iconGroups.some((group) => group.id === current);
      if (currentExists) return current;

      if (hasCommunicationMenu && location.pathname.startsWith('/communication/')) {
        return 'Internal Communication';
      }
      if (hasHelpMenu && location.pathname.startsWith('/help')) return 'Help Center';

      const matchingGroup = iconGroups.find((group) =>
        group.menu.some((item) => routeContainsPath(item, location.pathname)),
      );

      return matchingGroup?.id ?? iconGroups[0]!.id;
    });
  }, [hasCommunicationMenu, hasHelpMenu, iconGroups, location.pathname]);

  const activeGroup =
    iconGroups.find((group) => group.id === activeGroupId) ?? iconGroups[0] ?? null;

  return (
    <Sidebar
      collapsible="icon"
      style={
        {
          '--sidebar-width': 'calc(20rem + 3rem)',
          '--sidebar-width-icon': '3rem',
        } as React.CSSProperties
      }
      {...props}
    >
      <div className="flex h-full">
        <aside className="bg-sidebar/30 border-sidebar-border flex w-[--sidebar-width-icon] shrink-0 flex-col border-r py-2">
          <div className="px-1.5">
            <div className="flex h-9 w-full items-center justify-center rounded-md bg-black/20 p-1">
              <img src={appLogo} alt="VipEx logo" className="h-6 w-6 rounded-sm object-contain" />
            </div>
          </div>

          <div className="flex min-h-0 w-full flex-1 flex-col justify-start gap-2 py-2">
            {iconGroups.map((group) => {
              const isActive = activeGroup?.id === group.id;
              return (
                <div key={group.id} className="px-1.5">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        title={group.title}
                        onClick={() => {
                          setActiveGroupId(group.id);
                          if (group.isHelp && !location.pathname.startsWith('/help')) {
                            navigate('/help');
                          }
                        }}
                        className={cn(
                          'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex h-9 w-full items-center justify-center rounded-md transition-colors',
                          isActive && 'bg-primary text-primary-foreground',
                        )}
                        aria-label={group.title}
                      >
                        <Icon name={group.iconName} className="h-5 w-5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right" align="center">
                      {group.title}
                    </TooltipContent>
                  </Tooltip>
                </div>
              );
            })}
          </div>

          <div className="px-1.5 pt-1">
            <UserProfile
              variant="icon"
              className="h-9 w-full rounded-md border-0 bg-transparent p-0"
            />
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <SidebarHeader className="border-b border-sidebar-border px-3 py-2">
            {activeGroup?.isCommunication ? (
              <div className="space-y-2">
                <div>
                  <h2 className="truncate text-sm font-semibold">{activeGroup.title}</h2>
                  <p className="text-xs text-muted-foreground">
                    {communicationTab === 'chats'
                      ? 'Threads'
                      : communicationTab === 'channels'
                        ? 'Channels'
                        : communicationTab === 'colleagues'
                          ? 'People'
                          : 'Approvals'}
                  </p>
                </div>
                <Tabs
                  value={communicationTab}
                  onValueChange={(value) =>
                    setCommunicationTab(value as 'chats' | 'channels' | 'colleagues' | 'requests')
                  }
                >
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="chats" className="px-1 text-[11px]">
                      Chats
                    </TabsTrigger>
                    <TabsTrigger value="channels" className="px-1 text-[11px]">
                      Channels
                    </TabsTrigger>
                    <TabsTrigger value="colleagues" className="px-1 text-[11px]">
                      Users
                    </TabsTrigger>
                    <TabsTrigger value="requests" className="px-1 text-[11px]">
                      Requests
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            ) : activeGroup?.isHelp ? (
              <div>
                <h2 className="truncate text-sm font-semibold">Help Center</h2>
                <p className="text-xs text-muted-foreground">Table of contents</p>
              </div>
            ) : (
              <h2 className="truncate text-sm font-semibold">
                {activeGroup?.title ?? 'Navigation'}
              </h2>
            )}
          </SidebarHeader>
          <SidebarContent
            className={cn(
              'min-w-0',
              (activeGroup?.isCommunication || activeGroup?.isHelp) && 'overflow-hidden',
            )}
          >
            {activeGroup?.isCommunication ? (
              <CommunicationSidebarPanel key={communicationTab} activeTab={communicationTab} />
            ) : activeGroup?.isHelp ? (
              <HelpSidebarPanel />
            ) : activeGroup ? (
              <NavMain title={activeGroup.title} items={activeGroup.menu} />
            ) : null}
          </SidebarContent>
        </div>
      </div>
      <SidebarRail />
    </Sidebar>
  );
}
