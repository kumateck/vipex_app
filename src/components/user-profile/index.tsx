'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  BadgeCheck,
  Bell,
  Building2,
  CreditCard,
  LogOut,
  Settings,
  User,
  ChevronsUpDown,
  Shield,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/components/ui/sidebar';
import { useAuthStore, type AuthUser } from '@/stores/auth-store';

export interface UserProfileData {
  name: string;
  email: string;
  avatar?: string;
  role?: string;
  branch?: string;
  company?: string;
}

interface UserProfileProps {
  variant?: 'sidebar' | 'header';
  user?: UserProfileData;
  className?: string;
}

export function UserProfile({ variant = 'header', user, className }: UserProfileProps) {
  const navigate = useNavigate();
  const { isMobile } = useSidebar();
  const authUser = useAuthStore((s) => s.user);
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

  const handleLogout = () => {
    // TODO: Implement logout logic
    navigate('/login');
  };

  // Sidebar variant - full width button with details
  if (variant === 'sidebar') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className={cn(
              'flex w-full items-center gap-3 rounded-lg p-2 transition-colors',
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
            <div className="flex flex-1 flex-col items-start text-left leading-tight">
              <span className="truncate text-sm font-semibold text-foreground">
                {authUser?.fullname}
              </span>
              <span className="truncate text-xs text-muted-foreground">{authUser?.email}</span>
            </div>
            <ChevronsUpDown className="ml-auto h-4 w-4 text-muted-foreground shrink-0" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
          align="end"
          side={isMobile ? 'bottom' : 'right'}
          sideOffset={4}
          forceMount
        >
          <UserMenuContent userData={authUser} onLogout={handleLogout} onNavigate={navigate} />
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Header variant - compact circular avatar
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            'flex w-full items-center gap-3 rounded-lg p-2 transition-colors',
            'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            'data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground',
            className,
          )}
        >
          <Avatar className="h-10 w-10">
            <AvatarImage src={userData.avatar} alt={authUser?.fullname} />
            <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-1 flex-col items-start text-left leading-tight">
            <span className="truncate text-sm font-semibold text-foreground">
              {authUser?.branch?.name}
            </span>
            <span className="truncate text-xs text-muted-foreground">{authUser?.role?.name}</span>
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-72" align="end" sideOffset={8} forceMount>
        <UserMenuContent userData={authUser} onLogout={handleLogout} onNavigate={navigate} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Shared menu content for both variants
function UserMenuContent({
  userData,
  onLogout,
  onNavigate,
}: {
  userData: AuthUser | null;
  onLogout: () => void;
  onNavigate: (path: string) => void;
}) {
  const initials = userData?.fullname
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  return (
    <>
      <DropdownMenuLabel className="p-0 font-normal">
        <div className="flex items-center gap-3 px-2 py-3">
          <Avatar className="h-10 w-10 rounded-lg">
            <AvatarImage src={'authuser.avatar'} alt={userData?.fullname} />
            <AvatarFallback className="rounded-lg bg-primary text-primary-foreground font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-1 flex-col space-y-1">
            <p className="text-sm font-semibold leading-none">{userData?.fullname}</p>
            <p className="text-xs leading-none text-muted-foreground">{userData?.email}</p>
            <div className="flex flex-col gap-0.5 mt-1">
              {userData?.role && (
                <div className="flex items-center gap-1.5">
                  <Shield className="h-3 w-3 text-primary" />
                  <span className="text-xs text-primary font-medium">{userData?.role?.name}</span>
                </div>
              )}
              {userData?.branch && (
                <div className="flex items-center gap-1.5">
                  <Building2 className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{userData?.branch?.name}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuGroup>
        <DropdownMenuItem onClick={() => onNavigate('/profile')}>
          <User className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onNavigate('/settings')}>
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onNavigate('/settings/account')}>
          <BadgeCheck className="mr-2 h-4 w-4" />
          <span>Account</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onNavigate('/settings/billing')}>
          <CreditCard className="mr-2 h-4 w-4" />
          <span>Billing</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onNavigate('/notifications')}>
          <Bell className="mr-2 h-4 w-4" />
          <span>Notifications</span>
        </DropdownMenuItem>
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        onClick={onLogout}
        className="text-destructive focus:text-destructive focus:bg-destructive/10"
      >
        <LogOut className="mr-2 h-4 w-4" />
        <span>Log out</span>
      </DropdownMenuItem>
    </>
  );
}
