import { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import type { RiderDoorstepRecord } from '../../api/parcel.api';

const formatCurrency = (amountPsw: number | null | undefined) =>
  `GHS ${((amountPsw ?? 0) / 100).toFixed(2)}`;

export function useRiderAssignedColumns(
  onPrint: (parcelId: string) => Promise<void>,
  isPrinting: boolean,
) {
  return useMemo<ColumnDef<RiderDoorstepRecord>[]>(
    () => [
      { accessorKey: 'bookingCode', header: 'Booking' },
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
        id: 'deliveryFee',
        header: 'Delivery Fee',
        accessorFn: (row) => formatCurrency(row.deliveryFeePsw),
      },
      { id: 'status', header: 'Status', accessorFn: (row) => row.deliveryStatus },
      {
        id: 'action',
        header: 'Action',
        enableSorting: false,
        cell: ({ row }) => (
          <Button
            size="sm"
            variant="outline"
            disabled={isPrinting}
            onClick={() => void onPrint(row.original.parcelId)}
          >
            Print
          </Button>
        ),
      },
    ],
    [isPrinting, onPrint],
  );
}
