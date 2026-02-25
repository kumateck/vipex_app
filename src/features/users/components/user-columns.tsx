import type { ColumnDef } from '@tanstack/react-table';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import type { User } from '../types/user.types';

const USER_STATUS_LABELS: Record<number, string> = {
  0: 'Active',
  1: 'Invited',
  2: 'Removed',
  3: 'Blocked',
  4: 'Inactive',
  5: 'Suspended',
  6: 'Pending',
};

export function createUserColumns(): ColumnDef<User>[] {
  return [
    { accessorKey: 'fullname', header: 'Full name' },
    { accessorKey: 'email', header: 'Email' },
    { accessorKey: 'telephone', header: 'Telephone' },
    { accessorFn: (row) => row.roleName ?? row.roleId, id: 'roleName', header: 'Role' },
    { accessorFn: (row) => row.branchName ?? row.branchId, id: 'branchName', header: 'Branch' },
    {
      accessorFn: (row) => USER_STATUS_LABELS[row.status] ?? String(row.status),
      id: 'statusLabel',
      header: 'Status',
    },
    {
      id: 'actions',
      header: 'Actions',
      enableSorting: false,
      size: 100,
      cell: ({ row }) => (
        <Button variant="outline" size="sm" asChild>
          <Link to={`/users/edit/${row.original.id}`}>Edit</Link>
        </Button>
      ),
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
