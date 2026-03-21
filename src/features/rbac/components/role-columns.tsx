import type { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
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
      header: 'Actions',
      size: 280,
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => options.onRename(row.original)}>
            Rename
          </Button>
          <Button size="sm" variant="outline" onClick={() => options.onManagePermissions(row.original)}>
            Manage permissions
          </Button>
          <Button size="sm" variant="destructive" onClick={() => options.onDelete(row.original)}>
            Delete
          </Button>
        </div>
      ),
    });
  }

  return columns;
}
