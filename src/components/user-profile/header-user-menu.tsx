import { useRef, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { BranchSwitchDialog } from '@/features/auth/branch-switch';
import { PermissionKeys } from '@/shared/permissions/constants';
import { cn } from '@/lib/utils';
import type { AuthUser } from '@/stores/auth-store';
import { UserMenuContent } from './user-menu-content';

type HeaderUserMenuProps = {
  authUser: AuthUser | null;
  initials: string | undefined;
  avatar?: string;
  className?: string;
  navigate: (path: string) => void;
  handleLogout: () => Promise<void>;
};

export function HeaderUserMenu({
  authUser,
  initials,
  avatar,
  className,
  navigate,
  handleLogout,
}: HeaderUserMenuProps) {
  const [switchingBranch, setSwitchingBranch] = useState(false);
  const accountButton = useRef<HTMLButtonElement>(null);
  const canSwitchBranch = Boolean(
    authUser?.branch && authUser.permissions.includes(PermissionKeys.CanSwitchBranch),
  );

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            ref={accountButton}
            aria-label="Open account menu"
            className={cn(
              'flex w-full items-center gap-3 rounded-lg p-2 transition-colors',
              'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              'data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground',
              className,
            )}
          >
            <Avatar className="h-10 w-10">
              <AvatarImage src={avatar} alt={authUser?.fullname} />
              <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex flex-1 flex-col items-start text-left leading-tight">
              <span className="block w-full truncate text-sm font-semibold text-foreground">
                {authUser?.branch?.name}
              </span>
              <span className="block w-full truncate text-xs text-muted-foreground">
                {authUser?.role?.name}
              </span>
            </div>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-72"
          align="end"
          sideOffset={8}
          forceMount
          onCloseAutoFocus={(event) => {
            if (switchingBranch) event.preventDefault();
          }}
        >
          <UserMenuContent
            userData={authUser}
            onNavigate={navigate}
            onLogout={handleLogout}
            onSwitchBranch={canSwitchBranch ? () => setSwitchingBranch(true) : undefined}
          />
        </DropdownMenuContent>
      </DropdownMenu>
      {switchingBranch && authUser?.branch ? (
        <BranchSwitchDialog
          currentRole={authUser.role?.name ?? 'No role assigned'}
          currentBranch={authUser.branch.name}
          onClose={() => setSwitchingBranch(false)}
          returnFocus={accountButton}
        />
      ) : null}
    </>
  );
}
