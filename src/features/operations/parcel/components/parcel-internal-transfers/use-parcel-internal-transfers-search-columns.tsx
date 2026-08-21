import { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { EllipsisVertical } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { ParcelSearchRow } from '../../api/parcel.api';
import { ParcelInternalHolderBadge } from '../parcel-internal-holder-badge';

type UseParcelInternalTransfersSearchColumnsOptions = {
  selectedParcelIds: Set<string>;
  onAddParcel: (parcel: ParcelSearchRow) => void;
};

export function useParcelInternalTransfersSearchColumns({
  selectedParcelIds,
  onAddParcel,
}: UseParcelInternalTransfersSearchColumnsOptions) {
  return useMemo<ColumnDef<ParcelSearchRow>[]>(
    () => [
      { accessorKey: 'bookingCode', header: 'Booking' },
      { accessorKey: 'receiverName', header: 'Receiver' },
      { accessorKey: 'parcelDetails', header: 'Parcel' },
      {
        id: 'ageing',
        header: 'Ageing',
        cell: ({ row }) => (
          <div className="space-y-0.5 text-xs">
            <p>{row.original.ageingDays != null ? `${row.original.ageingDays} days` : '-'}</p>
            {row.original.isParcelAged ? (
              <Badge variant="destructive" className="text-[10px] px-1 py-0">
                Aged
              </Badge>
            ) : null}
          </div>
        ),
      },
      {
        id: 'storage',
        header: 'Storage',
        cell: ({ row }) => (
          <div className="text-xs">
            GHS {(((row.original.storageChargePsw ?? 0) as number) / 100).toFixed(2)}
          </div>
        ),
      },
      {
        id: 'holder',
        header: 'Current Holder',
        cell: ({ row }) => <ParcelInternalHolderBadge holder={row.original} />,
      },
      {
        id: 'action',
        header: 'Action',
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon"
                variant="outline"
                className="h-8 w-8"
                disabled={selectedParcelIds.has(row.original.id)}
              >
                <EllipsisVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onAddParcel(row.original)}>
                {selectedParcelIds.has(row.original.id) ? 'Selected' : 'Add'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [onAddParcel, selectedParcelIds],
  );
}
