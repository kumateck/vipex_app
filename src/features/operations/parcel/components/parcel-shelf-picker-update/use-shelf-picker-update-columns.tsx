import type { ColumnDef } from '@tanstack/react-table';
import { EllipsisVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ParcelStatus } from '@/db/schemas/enums';
import { CallCenterAssignmentPaymentCell } from '../parcel-call-center-assignment/call-center-assignment-payment-cell';
import type { ParcelRow } from './shelf-picker-update-types';

const getStatusLabel = (status: number) => {
  switch (status) {
    case ParcelStatus.CREATED:
      return 'Created';
    case ParcelStatus.AWAITING_PICKUP:
      return 'Awaiting Pickup';
    default:
      return 'Unknown';
  }
};

const getStatusVariant = (status: number) => {
  switch (status) {
    case ParcelStatus.CREATED:
      return 'outline';
    case ParcelStatus.AWAITING_PICKUP:
      return 'secondary';
    default:
      return 'default';
  }
};

export function useShelfPickerUpdateColumns({
  onOpenUpdateDialog,
  onEdit,
}: {
  onOpenUpdateDialog: (parcel: ParcelRow) => void;
  onEdit: (parcel: ParcelRow) => void;
}): ColumnDef<ParcelRow>[] {
  return [
    {
      accessorKey: 'bookingCode',
      header: 'Booking Code',
      cell: ({ row }) => <div className="font-mono font-medium">{row.original.bookingCode}</div>,
    },
    {
      accessorKey: 'receiverName',
      header: 'Receiver',
      cell: ({ row }) => (
        <div className="space-y-1">
          <div className="font-medium">{row.original.receiverName ?? '-'}</div>
          <div className="text-xs text-muted-foreground">{row.original.receiverPhone ?? '-'}</div>
        </div>
      ),
    },
    {
      accessorKey: 'parcelDetails',
      header: 'Details',
      cell: ({ row }) => <div className="text-sm">{row.original.parcelDetails}</div>,
    },
    {
      id: 'payment',
      header: 'Payment',
      cell: ({ row }) => <CallCenterAssignmentPaymentCell parcel={row.original} />,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={getStatusVariant(row.original.status)}>
          {getStatusLabel(row.original.status)}
        </Badge>
      ),
    },
    {
      accessorKey: 'pickerStaffName',
      header: 'Shelf Picker',
      cell: ({ row }) => (
        <>
          {row.original.pickerStaffName ? (
            <Badge variant="outline">{row.original.pickerStaffName}</Badge>
          ) : (
            <Badge variant="secondary">Not Assigned</Badge>
          )}
        </>
      ),
    },
    {
      id: 'actions',
      header: 'Action',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" variant="outline" className="h-8 w-8">
              <EllipsisVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onOpenUpdateDialog(row.original)}>
              Update
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(row.original)}>Edit</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
}
