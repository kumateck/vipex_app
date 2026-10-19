import { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { ParcelStatus } from '@/db/schemas/enums';
import type { ParcelSearchRow } from '../../api/parcel.api';
import type { ParcelSecondReceiverState } from '../../hooks';

export function useCashierSecondReceiverColumns(receiver: ParcelSecondReceiverState) {
  return useMemo<ColumnDef<ParcelSearchRow>[]>(
    () => [
      { accessorKey: 'bookingCode', header: 'Booking' },
      { accessorKey: 'receiverName', header: 'Main receiver' },
      {
        id: 'secondReceiver',
        header: 'Second receiver',
        accessorFn: (row) =>
          [row.secondReceiverName, row.secondReceiverPhone].filter(Boolean).join(' · ') ||
          'Not added',
      },
      {
        id: 'stage',
        header: 'Stage',
        accessorFn: (row) =>
          row.status === ParcelStatus.DISPATCHED ? 'With rider' : 'Ready for dispatch',
      },
      {
        id: 'action',
        header: 'Action',
        enableSorting: false,
        cell: ({ row }) =>
          receiver.canManage ? (
            <Button size="sm" variant="outline" onClick={() => receiver.open(row.original)}>
              {row.original.secondReceiverName ? 'Change Second Receiver' : 'Add Second Receiver'}
            </Button>
          ) : null,
      },
    ],
    [receiver.canManage, receiver.open],
  );
}
