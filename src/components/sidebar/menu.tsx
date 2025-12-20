// import { ChevronRight, MoreHorizontal } from 'lucide-react';
// import { Link, useLocation } from 'react-router-dom';

// import {
//   Collapsible,
//   CollapsibleContent,
//   CollapsibleTrigger,
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuTrigger,
//   Icon,
//   useSidebar,
// } from '@/components/ui';
// import {
//   SidebarGroup,
//   SidebarGroupLabel,
//   SidebarMenu,
//   SidebarMenuButton,
//   SidebarMenuItem,
//   SidebarMenuSub,
//   SidebarMenuSubButton,
//   SidebarMenuSubItem,
// } from '@/components/ui';
// import { cn } from '@/lib/utils';

// import { type Route } from './navigation';

// interface NavMainProps {
//   group: Route;
// }
// export function NavMain({ group }: NavMainProps) {
//   const { isMobile, state } = useSidebar();
//   // const currentPath = usePathname();
//   const location = useLocation();
//   const currentPath = location.pathname;

//   const isActiveRoute = (path: string) => currentPath === path;

//   return (
//     <SidebarGroup className={cn('')}>
//       <SidebarGroupLabel>
//         <span className="text-md uppercase text-primary">{group.title}</span>
//       </SidebarGroupLabel>

//       <SidebarMenu>
//         {group.menu.map((item) => {
//           const isActive = currentPath === item.url;
//           if (item?.items && item?.items.length > 0) {
//             return (
//               <Collapsible
//                 key={item.title}
//                 asChild
//                 defaultOpen={isActive}
//                 className="group/collapsible"
//               >
//                 <SidebarMenuItem className="flex flex-col items-center">
//                   <CollapsibleTrigger asChild>
//                     <SidebarMenuButton tooltip={item.title} className="w-full rounded-2xl py-5">
//                       <Icon
//                         name={item.icon}
//                         className={cn({
//                           'text-primary': isMobile || isActive,
//                           'text-neutral-500':
//                             (!isMobile && !isActive && state === 'expanded') ||
//                             (!isMobile && !isActive && state === 'collapsed'),
//                         })}
//                       />
//                       <div
//                         className={cn('text-sm font-normal', {
//                           'font-bold': isActive,
//                         })}
//                       >
//                         {item.title}
//                       </div>
//                       <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
//                     </SidebarMenuButton>
//                   </CollapsibleTrigger>
//                   <CollapsibleContent>
//                     <SidebarMenuSub>
//                       {item.items?.map((subItem) => {
//                         const isSubtActive = isActiveRoute(subItem.url as string);
//                         if (subItem.children) {
//                           return (
//                             <DropdownMenu key={subItem.title}>
//                               <SidebarMenuItem>
//                                 <DropdownMenuTrigger asChild>
//                                   <SidebarMenuButton className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
//                                     {subItem.title}
//                                     <MoreHorizontal className="ml-auto" />
//                                   </SidebarMenuButton>
//                                 </DropdownMenuTrigger>
//                                 {subItem.children && subItem.children?.length ? (
//                                   <DropdownMenuContent
//                                     side="right"
//                                     align="start"
//                                     className="min-w-56 rounded-lg"
//                                   >
//                                     {subItem.children.map((child, idx) => (
//                                       <DropdownMenuItem asChild key={idx}>
//                                         <Link to={child.url as string}>{child.title}</Link>
//                                       </DropdownMenuItem>
//                                     ))}
//                                   </DropdownMenuContent>
//                                 ) : null}
//                               </SidebarMenuItem>
//                             </DropdownMenu>
//                           );
//                         } else {
//                           return (
//                             <SidebarMenuSubItem key={subItem.title}>
//                               <SidebarMenuSubButton
//                                 className={cn(
//                                   'w-full rounded-2xl transition-colors',
//                                   isSubtActive && 'bg-primary text-white',
//                                   isSubtActive &&
//                                     'hover:bg-primary hover:text-white divide-purple-300',
//                                 )}
//                                 asChild
//                               >
//                                 <Link to={subItem.url as string} className="py-5">
//                                   {subItem.icon && (
//                                     <Icon
//                                       name={subItem.icon}
//                                       className={cn({
//                                         'text-white': isSubtActive,
//                                       })}
//                                     />
//                                   )}
//                                   <span
//                                     className={cn('text-left text-sm font-normal', {
//                                       'font-medium': isSubtActive,
//                                     })}
//                                   >
//                                     {subItem.title}
//                                   </span>
//                                 </Link>
//                               </SidebarMenuSubButton>
//                             </SidebarMenuSubItem>
//                           );
//                         }
//                       })}
//                     </SidebarMenuSub>
//                   </CollapsibleContent>
//                 </SidebarMenuItem>
//               </Collapsible>
//             );
//           } else {
//             return (
//               <SidebarMenuItem key={item.title} className="flex w-full items-center">
//                 <SidebarMenuButton
//                   asChild
//                   className={cn(
//                     'w-full rounded-2xl transition-colors',
//                     isActive && 'bg-primary text-white',
//                     isActive && 'hover:bg-primary hover:text-white divide-purple-300',
//                   )}
//                 >
//                   <Link to={item.url as string} className="py-5">
//                     <Icon
//                       name={item.icon}
//                       className={cn({
//                         'text-white': isMobile || isActive,
//                         'text-neutral-500':
//                           (!isMobile && !isActive && state === 'expanded') ||
//                           (!isMobile && !isActive && state === 'collapsed'),
//                       })}
//                     />
//                     <div
//                       className={cn('text-sm font-normal', {
//                         'font-medium': isActive,
//                       })}
//                     >
//                       {item.title}
//                     </div>
//                   </Link>
//                 </SidebarMenuButton>
//               </SidebarMenuItem>
//             );
//           }
//         })}
//       </SidebarMenu>
//     </SidebarGroup>
//   );
// }
'use client';

import { ChevronRight } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  SidebarGroup,
  SidebarGroupLabel,
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
    items?: Array<{
      title: string;
      url?: string;
    }>;
  }>;
}

export function NavMain({ title, items }: NavMainProps) {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{title}</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const hasChildren = !!item.items?.length;

          // Active if current path matches the item's url OR any child url
          const isActive =
            (!!item.url && currentPath === item.url) ||
            (hasChildren && item.items!.some((sub) => sub.url && currentPath === sub.url));

          if (hasChildren) {
            return (
              <Collapsible
                key={item.title}
                asChild
                defaultOpen={isActive}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip={item.title} isActive={isActive}>
                      {item.icon && <Icon name={item.icon} />}
                      <span>{item.title}</span>
                      <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items!.map((subItem) => {
                        const subActive = !!subItem.url && currentPath === subItem.url;

                        return (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton asChild isActive={subActive}>
                              <Link to={subItem.url as string}>
                                <span>{subItem.title}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        );
                      })}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            );
          }

          return (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild tooltip={item.title} isActive={isActive}>
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
