import { Building2, KeyRound, LogOut, MapPin, Shield, ShieldUser, User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { CASHIER_TYPE_LABELS } from '@/shared/access/constants';
import { UserType } from '@/db/schemas/enums';
import type { AuthUser } from '@/stores/auth-store';

export function UserMenuContent({
  userData,
  onNavigate,
  onLogout,
  onSwitchBranch,
}: {
  userData: AuthUser | null;
  onNavigate: (path: string) => void;
  onLogout: () => Promise<void>;
  onSwitchBranch?: () => void;
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
              {userData?.userType === UserType.CASHIER && userData?.cashierType !== null ? (
                <div className="flex items-center gap-1.5">
                  <ShieldUser className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {CASHIER_TYPE_LABELS[userData.cashierType] ?? `Cashier ${userData.cashierType}`}
                  </span>
                </div>
              ) : null}
              {userData?.branch && (
                <div className="flex items-center gap-1.5">
                  <Building2 className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{userData?.branch?.name}</span>
                </div>
              )}

              {userData?.location?.name || userData?.locationName ? (
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {userData?.location?.name ?? userData?.locationName}
                  </span>
                </div>
              ) : null}
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
        <DropdownMenuItem onClick={() => onNavigate('/settings/change-password')}>
          <KeyRound className="mr-2 h-4 w-4" />
          <span>Change Password</span>
        </DropdownMenuItem>
        {onSwitchBranch ? (
          <DropdownMenuItem onSelect={onSwitchBranch}>
            <Building2 className="mr-2 h-4 w-4" />
            <span>Switch branch</span>
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        onClick={() => {
          void onLogout();
        }}
        className="text-destructive focus:text-destructive focus:bg-destructive/10"
      >
        <LogOut className="mr-2 h-4 w-4" />
        <span>Log out</span>
      </DropdownMenuItem>
    </>
  );
}
