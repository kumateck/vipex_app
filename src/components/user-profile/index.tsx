'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronsUpDown } from 'lucide-react';
import { HeaderUserMenu } from './header-user-menu';
import { UserMenuContent } from './user-menu-content';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/components/ui/sidebar';
import { useAuthStore } from '@/stores/auth-store';
import { useLogoutMutation } from '@/features/auth/api';

export interface UserProfileData {
  name: string;
  email: string;
  avatar?: string;
  role?: string;
  branch?: string;
  company?: string;
}

interface UserProfileProps {
  variant?: 'sidebar' | 'header' | 'icon';
  user?: UserProfileData;
  className?: string;
}

export function UserProfile({ variant = 'header', user, className }: UserProfileProps) {
  const navigate = useNavigate();
  const { isMobile, state } = useSidebar();
  const authUser = useAuthStore((s) => s.user);
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const [logout] = useLogoutMutation();
  // TODO: Get from auth context if not provided
  const userData: UserProfileData = user ?? {
    name: 'Desmond Adusei',
    email: 'desdhi24@gmail.com',
    avatar: '/avatars/user.jpg',
    role: 'Super Admin',
    branch: 'Head Office',
    company: 'VIPEX',
  };

  const initials = authUser?.fullname
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  const handleLogout = async () => {
    const token = refreshToken ?? '';
    await logout({ refreshToken: token });
    navigate('/login', { replace: true });
  };

  const isSidebarCollapsed = variant === 'sidebar' && !isMobile && state === 'collapsed';

  // Sidebar variant - full width button with details
  if (variant === 'sidebar') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className={cn(
              'flex w-full items-center gap-3 rounded-lg p-2 transition-colors',
              isSidebarCollapsed && 'justify-center',
              'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              'data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground',
              className,
            )}
          >
            <Avatar className="h-8 w-8 rounded-lg">
              <AvatarImage src={userData.avatar} alt={authUser?.fullname} />
              <AvatarFallback className="rounded-lg bg-primary text-primary-foreground text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            {!isSidebarCollapsed ? (
              <>
                <div className="min-w-0 flex flex-1 flex-col items-start text-left leading-tight">
                  <span className="block w-full truncate text-sm font-semibold text-foreground">
                    {authUser?.fullname}
                  </span>
                  <span className="block w-full truncate text-xs text-muted-foreground">
                    {authUser?.email}
                  </span>
                </div>
                <ChevronsUpDown className="ml-1 h-4 w-4 shrink-0 text-muted-foreground" />
              </>
            ) : null}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
          align="end"
          side={isMobile ? 'bottom' : 'right'}
          sideOffset={4}
          forceMount
        >
          <UserMenuContent userData={authUser} onNavigate={navigate} onLogout={handleLogout} />
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  if (variant === 'icon') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className={cn(
              'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-ring data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground flex h-9 w-9 items-center justify-center rounded-full border border-sidebar-border bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2',
              className,
            )}
            aria-label="Open user menu"
          >
            <Avatar className="h-9 w-9 rounded-full">
              <AvatarImage src={userData.avatar} alt={authUser?.fullname} />
              <AvatarFallback className="bg-primary text-primary-foreground text-[11px] font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-72"
          align="end"
          side={isMobile ? 'top' : 'right'}
          sideOffset={8}
          forceMount
        >
          <UserMenuContent userData={authUser} onNavigate={navigate} onLogout={handleLogout} />
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <HeaderUserMenu
      authUser={authUser}
      avatar={userData.avatar}
      initials={initials}
      className={className}
      navigate={navigate}
      handleLogout={handleLogout}
    />
  );
}
