'use client';

import { ChevronRight } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import { Icon, type LucideIconProps } from '@/components/ui';

interface NavMainProps {
  title: string;
  items: Array<{
    title: string;
    url?: string;
    icon: LucideIconProps;
    isActive?: boolean;
    permissionKey?: string;
    hiddenInSidebar?: boolean;
    items?: Array<{
      title: string;
      url?: string;
      permissionKey?: string;
      hiddenInSidebar?: boolean;
      children?: Array<{
        title: string;
        url?: string;
        permissionKey?: string;
        hiddenInSidebar?: boolean;
        children?: Array<{
          title: string;
          url?: string;
          permissionKey?: string;
          hiddenInSidebar?: boolean;
        }>;
      }>;
    }>;
  }>;
}

type NestedNavItem = {
  title: string;
  url?: string;
  children?: NestedNavItem[];
};

export function NavMain({ items }: NavMainProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;

  const getFirstNavigableUrl = (nodes?: NestedNavItem[]): string | null => {
    if (!nodes?.length) return null;
    for (const node of nodes) {
      if (node.url) return node.url;
      const nested = getFirstNavigableUrl(node.children);
      if (nested) return nested;
    }
    return null;
  };

  const renderNestedItems = (nestedItems: NestedNavItem[]) =>
    nestedItems.map((nestedItem) => {
      const isNestedActive = !!nestedItem.url && currentPath === nestedItem.url;
      const hasNestedChildren = !!nestedItem.children?.length;

      if (hasNestedChildren) {
        const fallbackUrl = nestedItem.url ?? getFirstNavigableUrl(nestedItem.children);
        return (
          <Collapsible key={nestedItem.title} asChild defaultOpen className="group/collapsible">
            <SidebarMenuSubItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuSubButton
                  isActive={isNestedActive}
                  onClick={() => {
                    if (fallbackUrl && currentPath !== fallbackUrl) navigate(fallbackUrl);
                  }}
                >
                  <span>{nestedItem.title}</span>
                  <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                </SidebarMenuSubButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>{renderNestedItems(nestedItem.children!)}</SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuSubItem>
          </Collapsible>
        );
      }

      return (
        <SidebarMenuSubItem key={nestedItem.title}>
          <SidebarMenuSubButton asChild isActive={isNestedActive}>
            <Link to={nestedItem.url as string}>
              <span>{nestedItem.title}</span>
            </Link>
          </SidebarMenuSubButton>
        </SidebarMenuSubItem>
      );
    });

  return (
    <SidebarGroup>
      <SidebarMenu>
        {items.map((item) => {
          const hasChildren = !!item.items?.length;
          const isItemActive = !!item.url && currentPath === item.url;

          if (hasChildren) {
            const fallbackUrl = item.url ?? getFirstNavigableUrl(item.items);
            return (
              <Collapsible key={item.title} asChild defaultOpen className="group/collapsible">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      tooltip={item.title}
                      isActive={isItemActive}
                      onClick={() => {
                        if (fallbackUrl && currentPath !== fallbackUrl) navigate(fallbackUrl);
                      }}
                    >
                      {item.icon && <Icon name={item.icon} />}
                      <span>{item.title}</span>
                      <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <SidebarMenuSub>{renderNestedItems(item.items!)}</SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            );
          }

          return (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild tooltip={item.title} isActive={isItemActive}>
                <Link to={item.url as string}>
                  {item.icon && <Icon name={item.icon} />}
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
