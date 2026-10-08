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
import { ParcelTimestampsCell } from '../parcel-timestamps';
import { ParcelStorageFeeBadge } from '../parcel-storage-fee-badge';
import { canEditSecondReceiver } from '@/shared/shipments/second-receiver';
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
  onEditSecondReceiver,
  canManageSecondReceiver,
  onRequestDelivery,
  isRequestingDelivery,
  canRequestDelivery,
}: {
  onOpenUpdateDialog: (parcel: ParcelRow) => void;
  onEdit: (parcel: ParcelRow) => void;
  onEditSecondReceiver: (parcel: ParcelRow) => void;
  canManageSecondReceiver: boolean;
  onRequestDelivery: (parcel: ParcelRow) => Promise<void>;
  isRequestingDelivery: boolean;
  canRequestDelivery: boolean;
}): ColumnDef<ParcelRow>[] {
  return [
    {
      accessorKey: 'bookingCode',
      header: 'Booking Code',
      cell: ({ row }) => (
        <div className="space-y-1">
          <div className="font-mono font-medium">{row.original.bookingCode}</div>
          <ParcelStorageFeeBadge storageChargePsw={row.original.storageChargePsw} />
        </div>
      ),
    },
    {
      accessorKey: 'receiverName',
      header: 'Receiver',
      cell: ({ row }) => (
        <div className="space-y-1">
          <div className="font-medium">{row.original.receiverName ?? '-'}</div>
          <div className="text-xs text-muted-foreground">{row.original.receiverPhone ?? '-'}</div>
          {row.original.secondReceiverName ? (
            <div className="text-xs text-muted-foreground">
              2nd: {row.original.secondReceiverName}
              {row.original.secondReceiverPhone ? ` (${row.original.secondReceiverPhone})` : ''}
            </div>
          ) : null}
        </div>
      ),
    },
    {
      accessorKey: 'receivedAt',
      header: 'Dates',
      cell: ({ row }) => (
        <ParcelTimestampsCell
          createdAt={row.original.createdAt}
          receivedAt={row.original.receivedAt}
        />
      ),
    },
    {
      accessorKey: 'parcelDetails',
      header: 'Details',
      cell: ({ row }) => <div className="text-sm">{row.original.parcelDetails}</div>,
    },
    {
      accessorKey: 'parcelContent',
      header: 'Content',
      cell: ({ row }) => <div className="text-sm">{row.original.parcelContent || '-'}</div>,
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
            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8"
              disabled={isRequestingDelivery}
            >
              <EllipsisVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {canRequestDelivery ? (
              <DropdownMenuItem onClick={() => onOpenUpdateDialog(row.original)}>
                {row.original.pickerStaffId ? 'Reassign Shelf Pickup' : 'Assign Shelf Picker'}
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuItem onClick={() => onEdit(row.original)}>Edit</DropdownMenuItem>
            {canManageSecondReceiver && canEditSecondReceiver(row.original.status) ? (
              <DropdownMenuItem onClick={() => onEditSecondReceiver(row.original)}>
                {row.original.secondReceiverName ? 'Change Second Receiver' : 'Add Second Receiver'}
              </DropdownMenuItem>
            ) : null}
            {canRequestDelivery && row.original.status === ParcelStatus.AWAITING_PICKUP ? (
              <DropdownMenuItem onClick={() => void onRequestDelivery(row.original)}>
                Request Delivery
              </DropdownMenuItem>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
}
