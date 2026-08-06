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
import { formatPhones, getPaymentBucketLabel } from './parcel-pickup-queue-utils';

type UseParcelPickupQueueColumnsOptions = {
  onViewQueue: (parcel: ParcelSearchRow) => void;
};

export function useParcelPickupQueueColumns({ onViewQueue }: UseParcelPickupQueueColumnsOptions) {
  return useMemo<ColumnDef<ParcelSearchRow>[]>(
    () => [
      { accessorKey: 'bookingCode', header: 'Booking' },
      {
        id: 'receiver',
        header: 'Receiver',
        cell: ({ row }) => (
          <div className="leading-tight">
            <p className="font-medium">{row.original.receiverName ?? '-'}</p>
            <p className="text-muted-foreground text-xs">
              {formatPhones(row.original.receiverPhone, row.original.receiverPhone2)}
            </p>
          </div>
        ),
      },
      {
        id: 'secondReceiver',
        header: 'Second Receiver',
        cell: ({ row }) => (
          <div className="leading-tight">
            <p className="font-medium">{row.original.secondReceiverName ?? '-'}</p>
            <p className="text-muted-foreground text-xs">
              {formatPhones(row.original.secondReceiverPhone, row.original.secondReceiverPhone2)}
            </p>
          </div>
        ),
      },
      { accessorKey: 'parcelDetails', header: 'Parcel Details' },
      {
        id: 'source',
        header: 'Source',
        cell: ({ row }) => (
          <div className="leading-tight">
            <p className="font-medium">{row.original.sourceLocationName ?? '-'}</p>
            <p className="text-muted-foreground text-xs">{row.original.sourceName ?? '-'}</p>
          </div>
        ),
      },
      {
        id: 'destination',
        header: 'Destination',
        cell: ({ row }) => (
          <div className="leading-tight">
            <p className="font-medium">{row.original.pickupLocationName ?? '-'}</p>
            <p className="text-muted-foreground text-xs">{row.original.destinationName ?? '-'}</p>
          </div>
        ),
      },
      {
        id: 'paymentBucket',
        header: 'Payment',
        accessorFn: (row) => getPaymentBucketLabel(row),
      },
      {
        id: 'queue',
        header: 'Queue',
        accessorFn: (row) => row.pickupQueueCode ?? 'Not queued',
      },
      {
        id: 'action',
        header: 'Action',
        enableSorting: false,
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="outline" className="h-8 w-8">
                <EllipsisVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onViewQueue(row.original)}>
                {row.original.pickupQueueCode ? 'View Queue' : 'Create Queue'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [onViewQueue],
  );
}
