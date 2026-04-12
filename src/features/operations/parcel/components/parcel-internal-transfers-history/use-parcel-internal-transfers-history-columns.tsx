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
import { ParcelInternalTransferStatus } from '@/db/schemas/enums';
import type { ParcelInternalTransferRow } from '../../api/parcel.api';
import { holderSummary, transferStatusLabel } from './parcel-internal-transfers-history-utils';

type UseParcelInternalTransfersHistoryColumnsOptions = {
  canCancel: boolean;
  onViewTransfer: (transferId: string) => void;
  onCancelTransfer: (transferId: string) => void;
};

export function useParcelInternalTransfersHistoryColumns({
  canCancel,
  onViewTransfer,
  onCancelTransfer,
}: UseParcelInternalTransfersHistoryColumnsOptions) {
  return useMemo<ColumnDef<ParcelInternalTransferRow>[]>(
    () => [
      { accessorKey: 'referenceNo', header: 'Reference' },
      {
        id: 'source',
        header: 'From',
        accessorFn: (row) => holderSummary(row, 'source'),
      },
      {
        id: 'destination',
        header: 'To',
        accessorFn: (row) => holderSummary(row, 'destination'),
      },
      {
        id: 'status',
        header: 'Status',
        accessorFn: (row) => transferStatusLabel(row.status),
      },
      { accessorKey: 'itemCount', header: 'Parcels' },
      { accessorKey: 'transferredByName', header: 'Transferred By' },
      { accessorKey: 'transferredAt', header: 'Transferred At' },
      {
        id: 'action',
        header: 'Action',
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="outline" className="h-8 w-8">
                <EllipsisVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onViewTransfer(row.original.id)}>
                View
              </DropdownMenuItem>
              {canCancel && row.original.status === ParcelInternalTransferStatus.PENDING ? (
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => onCancelTransfer(row.original.id)}
                >
                  Cancel
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [canCancel, onCancelTransfer, onViewTransfer],
  );
}
