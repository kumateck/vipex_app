import { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Checkbox } from '@/components/ui/checkbox';
import type { ParcelSearchRow } from '../../api/parcel.api';
import { CallSenderBadge } from '../call-sender-badge';
import { ParcelStorageFeeBadge } from '../parcel-storage-fee-badge';
import { getConsignmentPaymentStatus } from '../parcel-processed-consignment/payment-status';
import { ParcelTransitRouteCell } from './parcel-transit-route-cell';
import { ParcelTransitActions } from './parcel-transit-actions';
import {
  formatDate,
  formatPhones,
  formatCurrency,
  formatConsignmentLabel,
} from './parcel-transit.utils';
import type { useParcelTransitWorkflow } from './use-parcel-transit-workflow';

export function useParcelTransitColumns(workflow: ReturnType<typeof useParcelTransitWorkflow>) {
  const { view, batchArrival, rows, rowNumberOffset, branchNameById, isUpdatingStatus } = workflow;
  return useMemo<ColumnDef<ParcelSearchRow>[]>(
    () => [
      ...(view === 'incoming'
        ? ([
            {
              id: 'select',
              header: () => (
                <Checkbox
                  checked={
                    batchArrival.allOnPageSelected
                      ? true
                      : batchArrival.someOnPageSelected
                        ? 'indeterminate'
                        : false
                  }
                  onCheckedChange={(checked) => batchArrival.toggleCurrentPage(checked === true)}
                  aria-label="Select all incoming parcels on this page"
                  disabled={rows.length === 0 || batchArrival.isLoading}
                />
              ),
              enableSorting: false,
              cell: ({ row }: { row: { original: ParcelSearchRow } }) => (
                <Checkbox
                  checked={batchArrival.isSelected(row.original.id)}
                  onCheckedChange={(checked) =>
                    batchArrival.toggleParcel(row.original, checked === true)
                  }
                  aria-label={`Select parcel ${row.original.bookingCode}`}
                  disabled={batchArrival.isLoading}
                />
              ),
            },
          ] satisfies ColumnDef<ParcelSearchRow>[])
        : []),
      {
        id: 'rowNumber',
        header: 'No.',
        enableSorting: false,
        cell: ({ row }) => (
          <span className="tabular-nums text-muted-foreground">
            {rowNumberOffset + row.index + 1}
          </span>
        ),
      },
      {
        id: 'booking',
        header: 'Booking',
        accessorFn: (row) => row.bookingCode,
        cell: ({ row }) => {
          const paymentStatus = getConsignmentPaymentStatus(row.original);
          return (
            <div className="leading-tight">
              <div className="flex items-center gap-2">
                <span
                  className={`h-2.5 w-2.5 shrink-0 rounded-full ${paymentStatus.dotClassName}`}
                />
                <p className="font-medium">{row.original.bookingCode}</p>
                <ParcelStorageFeeBadge storageChargePsw={row.original.storageChargePsw} />
              </div>
              <p className="pl-[18px] text-muted-foreground text-xs">
                Sent {formatDate(row.original.consignmentCreatedAt)}
              </p>
            </div>
          );
        },
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
        id: 'route',
        header: 'Route',
        cell: ({ row }) => (
          <ParcelTransitRouteCell
            parcel={row.original}
            sourceBranchFallback={branchNameById.get(row.original.sourceId)}
            destinationBranchFallback={branchNameById.get(row.original.destinationId)}
          />
        ),
      },
      {
        id: 'consignment',
        header: 'Consignment',
        accessorFn: (row) => formatConsignmentLabel(row.consignmentSerialForDay),
        cell: ({ row }) => {
          const outstandingPsw = Math.max(row.original.plannedToBePaidPsw ?? 0, 0);
          return (
            <div className="leading-tight">
              <p className="font-medium">
                {formatConsignmentLabel(row.original.consignmentSerialForDay)}
              </p>
              {outstandingPsw > 0 ? (
                <p className="text-muted-foreground text-xs">
                  Remaining {formatCurrency(outstandingPsw)}
                </p>
              ) : null}
            </div>
          );
        },
      },
      {
        id: 'actions',
        header: 'Action',
        enableSorting: false,
        cell: ({ row }) => <ParcelTransitActions parcel={row.original} workflow={workflow} />,
      },
    ],
    [batchArrival, branchNameById, isUpdatingStatus, rowNumberOffset, rows.length, view, workflow],
  );
}
