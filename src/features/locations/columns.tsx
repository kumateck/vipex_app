import { type ColumnDef } from '@tanstack/react-table';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import type { Location } from './api';

export const locationsColumns: ColumnDef<Location>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
  },
  {
    accessorKey: 'branchId',
    header: 'Branch ID',
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
