import type { ColumnDef } from '@tanstack/react-table';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
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
        const user = row.original;
        const canResendInvite = user.status === 1;
        const isActive = user.status === 0;
        const statusActionLabel = isActive ? 'Set inactive' : 'Set active';

        return (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to={`/users/edit/${user.id}`}>Edit</Link>
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={isUpdatingStatus}
              onClick={() => onToggleStatus?.(user)}
            >
              {statusActionLabel}
            </Button>
            {canResendInvite ? (
              <Button
                variant="secondary"
                size="sm"
                disabled={isResendingInvite}
                onClick={() => onResendInvite?.(user)}
              >
                Resend invite
              </Button>
            ) : null}
          </div>
        );
      },
    },
  ];
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
