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
import type { ParcelSearchRow } from '../../api/parcel.api';
import { ParcelStorageFeeBadge } from '../parcel-storage-fee-badge';

const formatCurrency = (amountPsw: number) => `GHS ${(amountPsw / 100).toFixed(2)}`;

export function useHomeDeliveryAddressColumns({
  isReturningToPickup,
  onReturnToPickup,
  onCollectAddress,
}: {
  isReturningToPickup: boolean;
  onReturnToPickup: (parcel: ParcelSearchRow) => unknown;
  onCollectAddress: (parcel: ParcelSearchRow) => void;
}) {
  return useMemo<ColumnDef<ParcelSearchRow>[]>(
    () => [
      {
        id: 'booking',
        header: 'Booking',
        cell: ({ row }) => (
          <div className="space-y-1">
            <span>{row.original.bookingCode}</span>
            <ParcelStorageFeeBadge storageChargePsw={row.original.storageChargePsw} />
          </div>
        ),
      },
      { accessorKey: 'parcelDetails', header: 'Parcel Details' },
      {
        id: 'receiver',
        header: 'Receiver',
        accessorFn: (row) =>
          `${row.receiverName ?? '-'}${row.receiverPhone ? ` (${row.receiverPhone})` : ''}`,
      },
      {
        id: 'toBePaid',
        header: 'To Be Paid',
        accessorFn: (row) => formatCurrency(row.outstandingPrincipalPsw ?? row.plannedToBePaidPsw),
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
                disabled={isReturningToPickup}
              >
                <EllipsisVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onCollectAddress(row.original)}>
                Collect Address
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => void onReturnToPickup(row.original)}>
                Return to Pickup
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [isReturningToPickup, onReturnToPickup, onCollectAddress],
  );
}
