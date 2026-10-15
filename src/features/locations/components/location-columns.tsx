import type { ColumnDef } from '@tanstack/react-table';
import { EllipsisVertical } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PermissionGuard } from '@/components/permissions/permission-guard';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PermissionKeys } from '@/shared/permissions/constants';
import type { Location } from '../types/location.types';

export function createLocationColumns(): ColumnDef<Location>[] {
  return [
    {
      accessorKey: 'name',
      id: 'locationName',
      header: 'Name',
    },
    {
      accessorFn: (row) => row.branch?.name ?? 'Unknown branch',
      id: 'branchName',
      header: 'Branch',
    },
    {
      id: 'canSend',
      header: 'Sending',
      accessorFn: (row) => (row.canSend === false ? 'No' : 'Yes'),
    },
    {
      id: 'canReceive',
      header: 'Receiving',
      accessorFn: (row) => (row.canReceive === false ? 'No' : 'Yes'),
    },
    {
      id: 'actions',
      header: 'Action',
      size: 70,
      enableSorting: false,
      cell: ({ row }) => (
        <PermissionGuard permissionKey={PermissionKeys.CanUpdateLocations}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                aria-label="Location actions"
                variant="outline"
                size="icon"
                className="h-8 w-8"
              >
                <EllipsisVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link to={`/locations/edit/${row.original.id}`}>Edit</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </PermissionGuard>
      ),
    },
  ];
}
