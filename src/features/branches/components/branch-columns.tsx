import type { ColumnDef } from '@tanstack/react-table';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
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
      id: 'actions',
      header: 'Actions',
      size: 100,
      enableSorting: false,
      cell: ({ row }) => (
        <Button variant="outline" size="sm" asChild>
          <Link to={`/branches/edit/${row.original.id}`}>Edit</Link>
        </Button>
      ),
    },
  ];
}
