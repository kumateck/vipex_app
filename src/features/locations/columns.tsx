import { type ColumnDef } from '@tanstack/react-table';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import type { Location } from './api';

export interface LocationRow extends Location {
  branchName: string;
}

export const locationsColumns: ColumnDef<LocationRow>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
  },
  {
    accessorKey: 'branchName',
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
