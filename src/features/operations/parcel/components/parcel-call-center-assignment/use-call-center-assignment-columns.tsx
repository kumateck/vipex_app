import type { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { formatDateTime } from '@/lib/dates';
import { CallCenterAssignmentPaymentCell } from './call-center-assignment-payment-cell';
import type { ParcelRow } from './call-center-assignment-types';

const formatPhones = (primary?: string | null, secondary?: string | null) =>
  [primary, secondary].filter(Boolean).join(' / ') || '-';

function formatReceivedAt(value: string | null) {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : formatDateTime(date);
}

export function useCallCenterAssignmentColumns({
  onOpenAssignDialog,
  selectedParcelIds,
  onToggleParcel,
  rows,
  onToggleAll,
}: {
  onOpenAssignDialog: (parcel: ParcelRow) => void;
  selectedParcelIds: Set<string>;
  onToggleParcel: (parcelId: string) => void;
  rows: ParcelRow[];
  onToggleAll: (checked: boolean) => void;
}): ColumnDef<ParcelRow>[] {
  const allSelected = rows.length > 0 && rows.every((row) => selectedParcelIds.has(row.id));
  const someSelected = rows.some((row) => selectedParcelIds.has(row.id)) && !allSelected;

  return [
    {
      id: 'select',
      header: () => (
        <Checkbox
          checked={allSelected ? true : someSelected ? 'indeterminate' : false}
          onCheckedChange={(checked) => onToggleAll(Boolean(checked))}
          aria-label="Select all parcels"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={selectedParcelIds.has(row.original.id)}
          onCheckedChange={() => onToggleParcel(row.original.id)}
          aria-label={`Select ${row.original.bookingCode}`}
        />
      ),
    },
    {
      accessorKey: 'bookingCode',
      header: 'Booking Code',
      cell: ({ row }) => <div className="font-mono font-medium">{row.original.bookingCode}</div>,
    },
    {
      accessorKey: 'senderName',
      header: 'Sender',
      cell: ({ row }) => (
        <div className="space-y-1">
          <div className="font-medium">{row.original.senderName ?? '-'}</div>
          <div className="text-xs text-muted-foreground">
            {formatPhones(row.original.senderPhone, row.original.senderPhone2)}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'receiverName',
      header: 'Receiver',
      cell: ({ row }) => (
        <div className="space-y-1">
          <div className="font-medium">{row.original.receiverName ?? '-'}</div>
          <div className="text-xs text-muted-foreground">
            {formatPhones(row.original.receiverPhone, row.original.receiverPhone2)}
          </div>
        </div>
      ),
    },
    {
      id: 'payment',
      header: 'Payment',
      cell: ({ row }) => <CallCenterAssignmentPaymentCell parcel={row.original} />,
    },
    {
      accessorKey: 'receivedAt',
      header: 'Received D&T',
      cell: ({ row }) => <div className="text-sm">{formatReceivedAt(row.original.receivedAt)}</div>,
    },
    {
      accessorKey: 'parcelDetails',
      header: 'Details',
      cell: ({ row }) => <div className="text-sm">{row.original.parcelDetails}</div>,
    },
    {
      accessorKey: 'callCenterAssignedToUserName',
      header: 'Assigned To',
      cell: ({ row }) => (
        <>
          {row.original.callCenterAssignedToUserName ? (
            <Badge variant="outline">{row.original.callCenterAssignedToUserName}</Badge>
          ) : (
            <Badge variant="secondary">Unassigned</Badge>
          )}
        </>
      ),
    },
    {
      id: 'actions',
      header: 'Action',
      cell: ({ row }) => (
        <Button variant="outline" size="sm" onClick={() => onOpenAssignDialog(row.original)}>
          {row.original.callCenterAssignedToUserName ? 'Reassign' : 'Assign'}
        </Button>
      ),
    },
  ];
}
