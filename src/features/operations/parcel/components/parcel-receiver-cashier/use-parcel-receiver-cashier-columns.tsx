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
import { CallSenderBadge } from '../call-sender-badge';
import {
  formatCurrency,
  formatPhones,
  formatStorageCharge,
  getPaymentType,
} from './receiver-cashier-utils';

type UseParcelReceiverCashierColumnsOptions = {
  isPickupQueueEnabled: boolean;
  isSaving: boolean;
  page: number;
  pageSize: number;
  onOpenParcelDialog: (parcel: ParcelSearchRow) => void;
  onEdit: (parcel: ParcelSearchRow) => void;
  onRequestDelivery: (parcel: ParcelSearchRow) => void;
};

export function useParcelReceiverCashierColumns({
  isPickupQueueEnabled,
  isSaving,
  page,
  pageSize,
  onOpenParcelDialog,
  onEdit,
  onRequestDelivery,
}: UseParcelReceiverCashierColumnsOptions) {
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
        cell: ({ row }) => {
          const paymentType = getPaymentType(row.original);
          return (
            <div className="inline-flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${paymentType.dotClassName}`} />
              <span>{row.original.bookingCode}</span>
            </div>
          );
        },
      },
      {
        id: 'parcel',
        header: 'Parcel',
        cell: ({ row }) => (
          <div className="leading-tight">
            <p className="font-medium">{row.original.parcelDetails || '-'}</p>
            <p className="text-muted-foreground text-xs">{row.original.parcelContent || '-'}</p>
          </div>
        ),
      },
      {
        id: 'sender',
        header: 'Sender',
        cell: ({ row }) => (
          <div className="leading-tight">
            <p className="font-medium">{row.original.senderName ?? '-'}</p>
            <p className="text-muted-foreground text-xs">
              {formatPhones(row.original.senderPhone, row.original.senderPhone2)}
            </p>
          </div>
        ),
      },
      {
        id: 'receiver',
        header: 'Receiver',
        cell: ({ row }) => (
          <div className="leading-tight">
            <div className="flex items-center gap-1.5">
              <p className="font-medium">{row.original.receiverName ?? '-'}</p>
              {row.original.callSender ? (
                <CallSenderBadge className="h-5 px-1.5 text-[10px]" />
              ) : null}
            </div>
            <p className="text-muted-foreground text-xs">
              {formatPhones(row.original.receiverPhone, row.original.receiverPhone2)}
            </p>
          </div>
        ),
      },
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
        id: 'amounts',
        header: 'Amounts',
        cell: ({ row }) => (
          <div className="whitespace-nowrap leading-tight">
            <p>
              <span className="text-muted-foreground text-xs">Charge:</span>{' '}
              {formatCurrency(row.original.chargePsw)}
              <span className="text-muted-foreground mx-1.5">·</span>
              <span className="text-muted-foreground text-xs">Due:</span>{' '}
              {formatCurrency(
                row.original.outstandingPrincipalPsw ?? row.original.plannedToBePaidPsw,
              )}
            </p>
            <p className="mt-1">
              <span className="text-muted-foreground text-xs">Accrued:</span>{' '}
              {formatStorageCharge(row.original)}
            </p>
          </div>
        ),
      },
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
            <Button size="icon" variant="outline" className="h-8 w-8" disabled={isSaving}>
              <EllipsisVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onOpenParcelDialog(row.original)}>
              Receive + Deliver
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(row.original)}>Edit</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onRequestDelivery(row.original)}>
              Request Delivery
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    });

    return columns;
  }, [
    isPickupQueueEnabled,
    isSaving,
    onOpenParcelDialog,
    onEdit,
    onRequestDelivery,
    page,
    pageSize,
  ]);
}
