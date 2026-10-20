import { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import type { ParcelSearchRow } from '../api/parcel.api';
import type { ParcelStatusTableProps } from '../types';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { CallSenderBadge } from '../components/call-sender-badge';
import { ParcelStorageFeeBadge } from '../components/parcel-storage-fee-badge';
import { STATUS_LABELS } from '../components/parcel-status/constants';
import {
  canChangeCallOutcome,
  formatCurrency,
  formatPhones,
  formatReceivedAt,
} from '../components/parcel-status/utils';
import { ParcelStatusRowActions } from '../components/parcel-status/parcel-status-row-actions';

type Props = Pick<
  ParcelStatusTableProps,
  | 'rows'
  | 'isSaving'
  | 'selectedParcelIds'
  | 'onSelectAll'
  | 'onToggleParcel'
  | 'onCallOutcome'
  | 'onMarkCalled'
  | 'onReturnToPickup'
  | 'onResendNotification'
>;

export function useParcelStatusColumns({
  rows,
  isSaving,
  selectedParcelIds,
  onSelectAll,
  onToggleParcel,
  onCallOutcome,
  onMarkCalled,
  onReturnToPickup,
  onResendNotification,
}: Props) {
  return useMemo<ColumnDef<ParcelSearchRow>[]>(
    () => [
      {
        id: 'select',
        header: () => (
          <Checkbox
            checked={
              rows.some((row) => !row.callCenterCalledAt && canChangeCallOutcome(row.status)) &&
              rows
                .filter((row) => !row.callCenterCalledAt && canChangeCallOutcome(row.status))
                .every((row) => selectedParcelIds.has(row.id))
            }
            onCheckedChange={(checked) => onSelectAll(checked === true)}
            aria-label="Select all parcels"
          />
        ),
        enableSorting: false,
        cell: ({ row }) => (
          <Checkbox
            disabled={
              isSaving ||
              Boolean(row.original.callCenterCalledAt) ||
              !canChangeCallOutcome(row.original.status)
            }
            checked={selectedParcelIds.has(row.original.id)}
            onCheckedChange={(checked) => onToggleParcel(row.original.id, checked === true)}
            aria-label={`Select ${row.original.bookingCode}`}
          />
        ),
      },
      {
        id: 'rowNumber',
        header: 'No.',
        enableSorting: false,
        cell: ({ row }) => (
          <span className="tabular-nums text-muted-foreground">{row.index + 1}</span>
        ),
      },
      {
        id: 'booking',
        header: 'Booking',
        accessorFn: (row) => row.bookingCode,
        cell: ({ row }) => (
          <div className="leading-tight">
            <p className="font-medium">{row.original.bookingCode}</p>
            <p className="text-muted-foreground text-xs">
              Received {formatReceivedAt(row.original.receivedAt)}
            </p>
            <ParcelStorageFeeBadge storageChargePsw={row.original.storageChargePsw} />
          </div>
        ),
      },
      {
        id: 'parcel',
        header: 'Parcel',
        accessorFn: (row) => `${row.parcelDetails} ${row.parcelContent}`,
        cell: ({ row }) => (
          <div className="leading-tight">
            <p className="font-medium">{row.original.parcelDetails || '-'}</p>
            <p className="text-muted-foreground text-xs">{row.original.parcelContent || '-'}</p>
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
        id: 'receiverPayment',
        header: 'Receiver Pays',
        cell: ({ row }) =>
          row.original.plannedToBePaidPsw > 0 ? (
            <div className="space-y-1">
              <Badge variant="secondary">Yes</Badge>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(row.original.plannedToBePaidPsw)}
              </p>
            </div>
          ) : (
            <Badge variant="outline">No</Badge>
          ),
      },
      {
        id: 'status',
        header: 'Status',
        accessorFn: (row) => STATUS_LABELS[row.status] ?? String(row.status),
        cell: ({ row }) => {
          const contacted = Boolean(row.original.callCenterCalledAt);
          return (
            <div className="space-y-1">
              <Badge
                variant="outline"
                className={
                  contacted ? 'border-green-600 text-green-600' : 'border-amber-500 text-amber-600'
                }
              >
                {contacted ? 'Contacted' : 'Not Contacted'}
              </Badge>
              <p className="text-xs text-muted-foreground">
                {STATUS_LABELS[row.original.status] ?? String(row.original.status)}
              </p>
            </div>
          );
        },
      },
      {
        id: 'actions',
        header: 'Action',
        enableSorting: false,
        cell: ({ row }) => (
          <ParcelStatusRowActions
            parcel={row.original}
            isSaving={isSaving}
            onCallOutcome={onCallOutcome}
            onMarkCalled={onMarkCalled}
            onReturnToPickup={onReturnToPickup}
            onResendNotification={onResendNotification}
          />
        ),
      },
    ],
    [
      isSaving,
      onCallOutcome,
      onResendNotification,
      onMarkCalled,
      onReturnToPickup,
      onSelectAll,
      onToggleParcel,
      rows,
      selectedParcelIds,
    ],
  );
}
