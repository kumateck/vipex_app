import { useMemo } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { EllipsisVertical } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ParcelStatus } from '@/db/schemas/enums';
import type { ParcelSearchRow } from '../../api/parcel.api';

const money = (amountPsw: number | null | undefined) =>
  `GHS ${((amountPsw ?? 0) / 100).toFixed(2)}`;

export function useHomeDeliveryDispatchColumns(input: {
  selectedIds: string[];
  setSelectedIds: Dispatch<SetStateAction<string[]>>;
  isReturningToPickup: boolean;
  isPrinting: boolean;
  onReturnToPickup: (parcel: ParcelSearchRow) => void;
  onPrint: (parcel: ParcelSearchRow) => void;
}) {
  const {
    selectedIds,
    setSelectedIds,
    isReturningToPickup,
    isPrinting,
    onReturnToPickup,
    onPrint,
  } = input;
  return useMemo<ColumnDef<ParcelSearchRow>[]>(
    () => [
      {
        id: 'select',
        header: 'Select',
        cell: ({ row }) => (
          <Checkbox
            checked={selectedIds.includes(row.original.id)}
            onCheckedChange={(next) =>
              setSelectedIds((prev) =>
                next ? [...prev, row.original.id] : prev.filter((id) => id !== row.original.id),
              )
            }
          />
        ),
      },
      { accessorKey: 'bookingCode', header: 'Booking' },
      { accessorKey: 'parcelDetails', header: 'Parcel Details' },
      {
        id: 'receiver',
        header: 'Receiver',
        accessorFn: (row) =>
          `${row.receiverName ?? '-'}${row.receiverPhone ? ` (${row.receiverPhone})` : ''}`,
      },
      {
        id: 'statusLabel',
        header: 'Status',
        accessorFn: (row) =>
          row.status === ParcelStatus.ADDRESS_COLLECTED
            ? 'Address Collected'
            : 'Returned To Office',
      },
      {
        id: 'addressCollection',
        header: 'Address',
        cell: ({ row }) =>
          row.original.dropoffAddress ? (
            <div className="space-y-1">
              <Badge variant="secondary">Collected</Badge>
              <p className="max-w-xs text-xs text-muted-foreground">
                {row.original.dropoffAddress}
              </p>
            </div>
          ) : (
            <Badge variant="outline">Pending</Badge>
          ),
      },
      {
        id: 'toBePaid',
        header: 'To Be Paid',
        accessorFn: (row) => money(row.outstandingPrincipalPsw ?? row.plannedToBePaidPsw),
      },
      {
        id: 'deliveryFee',
        header: 'Delivery Fee',
        accessorFn: (row) => money(row.deliveryFeePsw),
      },
      {
        id: 'action',
        header: 'Action',
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={isPrinting}
              onClick={() => onPrint(row.original)}
            >
              Print
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="outline" className="h-8 w-8">
                  <EllipsisVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  disabled={isReturningToPickup}
                  onClick={() => onReturnToPickup(row.original)}
                >
                  Return to Pickup
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    [selectedIds, setSelectedIds, isReturningToPickup, isPrinting, onReturnToPickup, onPrint],
  );
}
