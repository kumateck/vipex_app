import type { ColumnDef } from '@tanstack/react-table';
import { EllipsisVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Role } from '../api/rbac.api';

interface RoleColumnsOptions {
  onRename: (role: Role) => void;
  onManagePermissions: (role: Role) => void;
  onDelete: (role: Role) => void;
  canManage: boolean;
}

export function createRoleColumns(options: RoleColumnsOptions): ColumnDef<Role>[] {
  const columns: ColumnDef<Role>[] = [
    { accessorKey: 'name', header: 'Role name' },
    {
      accessorFn: (row) => row.permissions.length,
      id: 'permissionsCount',
      header: 'Permissions',
    },
  ];

  if (options.canManage) {
    columns.push({
      id: 'actions',
      header: 'Action',
      size: 70,
      enableSorting: false,
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="h-8 w-8">
              <EllipsisVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => options.onRename(row.original)}>
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => options.onManagePermissions(row.original)}>
              Manage permissions
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={() => options.onDelete(row.original)}>
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    });
  }

  return columns;
}
