import type { ColumnDef } from '@tanstack/react-table';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PermissionGuard } from '@/components/permissions/permission-guard';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { PermissionKeys } from '@/shared/permissions/constants';
import type { User } from '../types/user.types';
import { USER_TYPE_LABELS } from '@/shared/access/constants';

const USER_STATUS_LABELS: Record<number, string> = {
  0: 'Active',
  1: 'Invited',
  2: 'Removed',
  3: 'Blocked',
  4: 'Inactive',
  5: 'Suspended',
  6: 'Pending',
};

export function createUserColumns(options?: {
  onResendInvite?: (user: User) => void;
  onToggleStatus?: (user: User) => void;
  isResendingInvite?: boolean;
  isUpdatingStatus?: boolean;
}): ColumnDef<User>[] {
  const onResendInvite = options?.onResendInvite;
  const onToggleStatus = options?.onToggleStatus;
  const isResendingInvite = options?.isResendingInvite ?? false;
  const isUpdatingStatus = options?.isUpdatingStatus ?? false;

  return [
    { accessorKey: 'fullname', header: 'Full name' },
    { accessorKey: 'email', header: 'Email' },
    { accessorKey: 'telephone', header: 'Telephone' },
    { accessorFn: (row) => row.roleName ?? row.roleId, id: 'roleName', header: 'Role' },
    {
      accessorFn: (row) => USER_TYPE_LABELS[row.userType] ?? row.userType,
      id: 'userType',
      header: 'User type',
    },
    { accessorFn: (row) => row.branchName ?? row.branchId, id: 'branchName', header: 'Branch' },
    { accessorFn: (row) => row.locationName ?? '-', id: 'locationName', header: 'Location' },
    {
      accessorFn: (row) => USER_STATUS_LABELS[row.status] ?? String(row.status),
      id: 'statusLabel',
      header: 'Status',
    },
    {
      id: 'actions',
      header: 'Actions',
      enableSorting: false,
      size: 220,
      cell: ({ row }) => {
        return (
          <UserActionsCell
            user={row.original}
            onResendInvite={onResendInvite}
            onToggleStatus={onToggleStatus}
            isResendingInvite={isResendingInvite}
            isUpdatingStatus={isUpdatingStatus}
          />
        );
      },
    },
  ];
}

function UserActionsCell({
  user,
  onResendInvite,
  onToggleStatus,
  isResendingInvite,
  isUpdatingStatus,
}: {
  user: User;
  onResendInvite?: (user: User) => void;
  onToggleStatus?: (user: User) => void;
  isResendingInvite: boolean;
  isUpdatingStatus: boolean;
}) {
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const canResendInvite = user.status === 1;
  const isActive = user.status === 0;
  const statusActionLabel = isActive ? 'Set inactive' : 'Set active';
  const statusDialogTitle = isActive ? 'Set user inactive?' : 'Set user active?';
  const statusDialogDescription = isActive
    ? `This will set ${user.fullname} to inactive and limit account access until reactivated.`
    : `This will reactivate ${user.fullname}'s account.`;

  return (
    <>
      <div className="flex items-center gap-2">
        <PermissionGuard permissionKey={PermissionKeys.CanUpdateUsers}>
          <Button variant="outline" size="sm" asChild>
            <Link to={`/users/edit/${user.id}`}>Edit</Link>
          </Button>
        </PermissionGuard>
        <PermissionGuard permissionKey={PermissionKeys.CanUpdateUsers}>
          <Button
            variant="secondary"
            size="sm"
            disabled={isUpdatingStatus}
            onClick={() => setIsStatusDialogOpen(true)}
          >
            {statusActionLabel}
          </Button>
        </PermissionGuard>
        {canResendInvite ? (
          <PermissionGuard permissionKey={PermissionKeys.CanResendSetupInvite}>
            <Button
              variant="secondary"
              size="sm"
              disabled={isResendingInvite}
              onClick={() => onResendInvite?.(user)}
            >
              Resend invite
            </Button>
          </PermissionGuard>
        ) : null}
      </div>
      <AlertDialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{statusDialogTitle}</AlertDialogTitle>
            <AlertDialogDescription>{statusDialogDescription}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdatingStatus}>Cancel</AlertDialogCancel>
            <PermissionGuard permissionKey={PermissionKeys.CanUpdateUsers}>
              <AlertDialogAction
                disabled={isUpdatingStatus}
                onClick={() => {
                  onToggleStatus?.(user);
                  setIsStatusDialogOpen(false);
                }}
              >
                {isUpdatingStatus ? 'Saving...' : statusActionLabel}
              </AlertDialogAction>
            </PermissionGuard>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export const userStatusOptions = [
  { value: 0, label: 'Active' },
  { value: 1, label: 'Invited' },
  { value: 2, label: 'Removed' },
  { value: 3, label: 'Blocked' },
  { value: 4, label: 'Inactive' },
  { value: 5, label: 'Suspended' },
  { value: 6, label: 'Pending' },
];
