import type { ColumnDef } from '@tanstack/react-table';
import { EllipsisVertical } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PermissionGuard } from '@/components/permissions/permission-guard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { BRANCH_TYPE_LABELS } from '@/shared/access/constants';
import { PermissionKeys } from '@/shared/permissions/constants';
import type { Branch } from '../types/branch.types';

export function createBranchColumns(): ColumnDef<Branch>[] {
  return [
    {
      accessorKey: 'name',
      header: 'Name',
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => BRANCH_TYPE_LABELS[row.original.type] ?? String(row.original.type),
    },
    {
      accessorKey: 'address',
      header: 'Address',
      cell: ({ row }) => row.original.address ?? '—',
    },
    {
      accessorKey: 'telephone',
      header: 'Contact',
      cell: ({ row }) => row.original.telephone ?? row.original.email ?? '—',
    },
    {
      id: 'pickupQueue',
      header: 'Pickup Queue',
      cell: ({ row }) =>
        row.original.usePickupQueue ? (
          <Badge variant="default">Enabled</Badge>
        ) : (
          <Badge variant="outline">Disabled</Badge>
        ),
    },
    {
      id: 'actions',
      header: 'Action',
      size: 70,
      enableSorting: false,
      cell: ({ row }) => (
        <PermissionGuard permissionKey={PermissionKeys.CanUpdateBranches}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-8 w-8">
                <EllipsisVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link to={`/branches/edit/${row.original.id}`}>Edit</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </PermissionGuard>
      ),
    },
  ];
}
