import type { ColumnDef } from '@tanstack/react-table';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import type { Location } from '../types/location.types';

export function createLocationColumns(): ColumnDef<Location>[] {
  return [
    {
      accessorKey: 'name',
      header: 'Name',
    },
    {
      accessorFn: (row) => row.branch?.name ?? row.branchId,
      id: 'branchName',
      header: 'Branch',
    },
    {
      id: 'actions',
      header: 'Actions',
      size: 100,
      enableSorting: false,
      cell: ({ row }) => (
        <Button variant="outline" size="sm" asChild>
          <Link to={`/locations/edit/${row.original.id}`}>Edit</Link>
        </Button>
      ),
    },
  ];
}
