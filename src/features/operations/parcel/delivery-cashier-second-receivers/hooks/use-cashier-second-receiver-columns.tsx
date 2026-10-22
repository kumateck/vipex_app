import { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { ViewParcelDetailsButton } from '@/features/operations/parcel-details';
import { ParcelStatus } from '@/db/schemas/enums';
import type { ParcelSearchRow } from '../../api/parcel.api';
import type { ParcelSecondReceiverState } from '../../hooks';
import {
  HandoverReferenceCell,
  HandoverCustomersCell,
  HandoverDescriptionCell,
  HandoverDeliveryCell,
  HandoverDatesCell,
  HandoverPaymentCell,
} from '../components/handover-cells';

export function useCashierSecondReceiverColumns(
  receiver: Pick<ParcelSecondReceiverState, 'canManage' | 'open'>,
) {
  return useMemo<ColumnDef<ParcelSearchRow>[]>(
    () => [
      {
        accessorKey: 'bookingCode',
        header: 'Parcel Reference',
        cell: ({ row }) => <HandoverReferenceCell parcel={row.original} />,
      },
      {
        id: 'customers',
        header: 'Customers',
        enableSorting: false,
        cell: ({ row }) => <HandoverCustomersCell parcel={row.original} />,
      },
      {
        id: 'description',
        header: 'Parcel Description',
        enableSorting: false,
        cell: ({ row }) => <HandoverDescriptionCell parcel={row.original} />,
      },
      {
        id: 'stage',
        header: 'Route & Delivery',
        enableSorting: false,
        accessorFn: (row) =>
          row.status === ParcelStatus.DISPATCHED ? 'With rider' : 'Ready for dispatch',
        cell: ({ row, getValue }) => (
          <HandoverDeliveryCell parcel={row.original} stage={getValue<string>()} />
        ),
      },
      {
        id: 'payment',
        header: 'Payment',
        enableSorting: false,
        cell: ({ row }) => <HandoverPaymentCell parcel={row.original} />,
      },
      {
        accessorKey: 'createdAt',
        header: 'Dates',
        cell: ({ row }) => <HandoverDatesCell parcel={row.original} />,
      },
      {
        id: 'action',
        header: 'Action',
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex flex-col items-start gap-2">
            <ViewParcelDetailsButton parcelId={row.original.id} label="View Details" />
            {receiver.canManage ? (
              <Button size="sm" variant="outline" onClick={() => receiver.open(row.original)}>
                {row.original.secondReceiverName ? 'Change Second Receiver' : 'Add Second Receiver'}
              </Button>
            ) : null}
          </div>
        ),
      },
    ],
    [receiver.canManage, receiver.open],
  );
}
