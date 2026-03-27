import type { ColumnDef } from '@tanstack/react-table';
import { Link } from 'react-router-dom';
import { PermissionGuard } from '@/components/permissions/permission-guard';
import { Button } from '@/components/ui/button';
import { PermissionKeys } from '@/shared/permissions/constants';
import type { Status } from '../types/status.types';

export function createStatusColumns(): ColumnDef<Status>[] {
  return [
    {
      accessorKey: 'name',
      header: 'Name',
    },
    {
      accessorKey: 'color',
      header: 'Color',
      cell: ({ row }) => {
        const color = row.original.color;
        return (
          <div className="flex items-center gap-2">
            <span
              className="inline-block h-3 w-3 rounded-full border"
              style={{ backgroundColor: color }}
              aria-hidden
            />
            <span>{color}</span>
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      size: 100,
      enableSorting: false,
      cell: ({ row }) => (
        <PermissionGuard permissionKey={PermissionKeys.CanUpdateStatuses}>
          <Button variant="outline" size="sm" asChild>
            <Link to={`/statuses/edit/${row.original.id}`}>Edit</Link>
          </Button>
        </PermissionGuard>
      ),
    },
  ];
}
