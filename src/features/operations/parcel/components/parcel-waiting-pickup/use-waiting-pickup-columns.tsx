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
import { ParcelCustomerCell, ParcelRouteCell } from '../parcel-party-route-cells';
import { formatDateTime } from '../parcel-receiver-cashier/receiver-cashier-utils';
import { ParcelTimestampsCell } from '../parcel-timestamps';
import { ViewParcelDetailsMenuItem } from '@/features/operations/parcel-details';

function formatCurrency(amountPsw: number) {
  return `GHS ${(amountPsw / 100).toFixed(2)}`;
}

function paymentDotClass(row: Pick<ParcelSearchRow, 'chargePsw' | 'plannedToBePaidPsw'>) {
  const charge = Number(row.chargePsw ?? 0);
  const receiverDue = Math.max(Number(row.plannedToBePaidPsw ?? 0), 0);
  if (receiverDue <= 0) return 'bg-emerald-500';
  if (receiverDue >= charge) return 'bg-amber-500';
  return 'bg-sky-500';
}

type WaitingPickupColumnsInput = {
  page: number;
  pageSize: number;
  isPickupQueueEnabled: boolean;
  isSaving: boolean;
  onOpen: (parcel: ParcelSearchRow) => void;
  onEdit: (parcel: ParcelSearchRow) => void;
  onRequestDelivery: (parcel: ParcelSearchRow) => Promise<void>;
};

export function useWaitingPickupColumns({
  page,
  pageSize,
  isPickupQueueEnabled,
  isSaving,
  onOpen,
  onEdit,
  onRequestDelivery,
}: WaitingPickupColumnsInput) {
  return useMemo<ColumnDef<ParcelSearchRow>[]>(() => {
    const columns: ColumnDef<ParcelSearchRow>[] = [
      {
        id: 'rowNumber',
        header: 'No.',
        enableSorting: false,
        cell: ({ row }) => (page - 1) * pageSize + row.index + 1,
      },
      {
        accessorKey: 'bookingCode',
        header: 'Booking',
        cell: ({ row }) => (
          <div className="inline-flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${paymentDotClass(row.original)}`} />
            <span>{row.original.bookingCode}</span>
          </div>
        ),
      },
      {
        id: 'customer',
        header: 'Customer',
        cell: ({ row }) => <ParcelCustomerCell parcel={row.original} />,
      },
      {
        id: 'route',
        header: 'Route',
        cell: ({ row }) => <ParcelRouteCell parcel={row.original} />,
      },
      {
        id: 'parcel',
        header: 'Parcel',
        cell: ({ row }) => (
          <div className="leading-tight">
            <p className="font-medium">{row.original.parcelDetails ?? '-'}</p>
            <p className="text-muted-foreground text-xs">{row.original.parcelContent ?? '-'}</p>
          </div>
        ),
      },
      {
        id: 'receivedAt',
        header: 'Dates',
        accessorFn: (row) => formatDateTime(row.receivedAt),
        cell: ({ row }) => (
          <ParcelTimestampsCell
            createdAt={row.original.createdAt}
            receivedAt={row.original.receivedAt}
          />
        ),
      },
      { id: 'charge', header: 'Charge', accessorFn: (row) => formatCurrency(row.chargePsw) },
    ];

    if (isPickupQueueEnabled) {
      columns.push({
        id: 'pickupQueue',
        header: 'Queue Code',
        accessorFn: (row) => row.pickupQueueCode ?? '-',
      });
    }

    columns.push({
      id: 'action',
      header: 'Action',
      enableSorting: false,
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              aria-label="Parcel actions"
              size="icon"
              variant="outline"
              className="h-8 w-8"
              disabled={isSaving}
            >
              <EllipsisVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <ViewParcelDetailsMenuItem parcelId={row.original.id} label="Full Details" />
            <DropdownMenuItem onClick={() => onOpen(row.original)}>View Details</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(row.original)}>Edit</DropdownMenuItem>
            <DropdownMenuItem onClick={() => void onRequestDelivery(row.original)}>
              Request Delivery
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    });

    return columns;
  }, [isPickupQueueEnabled, isSaving, onOpen, onEdit, onRequestDelivery, page, pageSize]);
}
