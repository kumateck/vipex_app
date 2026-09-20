import type { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import type { ParcelRow } from './call-center-assignment-types';

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
      cell: ({ row }) => <span className="font-mono font-medium">{row.original.bookingCode}</span>,
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
