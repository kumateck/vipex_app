import { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { EllipsisVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { ParcelInternalTransferRow } from '../../api/parcel.api';
import { holderTypeLabel } from './parcel-internal-transfer-utils';

type UseParcelInternalTransferColumnsOptions = {
  onSelectTransfer: (transferId: string) => void;
};

export function useParcelInternalTransferColumns({
  onSelectTransfer,
}: UseParcelInternalTransferColumnsOptions) {
  return useMemo<ColumnDef<ParcelInternalTransferRow>[]>(
    () => [
      { accessorKey: 'referenceNo', header: 'Reference' },
      {
        id: 'from',
        header: 'From',
        accessorFn: (row) =>
          row.sourceLocationName ??
          row.sourceWarehouseName ??
          holderTypeLabel(row.sourceHolderType),
      },
      {
        id: 'to',
        header: 'To',
        accessorFn: (row) =>
          row.destinationLocationName ??
          row.destinationWarehouseName ??
          holderTypeLabel(row.destinationHolderType),
      },
      { accessorKey: 'itemCount', header: 'Parcels' },
      { accessorKey: 'transferredByName', header: 'Transferred By' },
      { accessorKey: 'transferredAt', header: 'Transferred At' },
      {
        id: 'select',
        header: 'Action',
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="outline" className="h-8 w-8">
                <EllipsisVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onSelectTransfer(row.original.id)}>
                View
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [onSelectTransfer],
  );
}
