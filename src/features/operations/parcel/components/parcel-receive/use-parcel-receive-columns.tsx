import { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';
import { EllipsisVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getErrorMessage as getApplicationErrorMessage } from '@/lib/TheAduseiErrorResponse';
import { formatDateTime } from '@/lib/dates';
import { ParcelHandoverNoteAction } from '@/features/operations/parcel-handover-note';
import { ViewParcelDetailsMenuItem } from '@/features/operations/parcel-details';
import type { ParcelSearchRow } from '../../api/parcel.api';
import { ParcelInternalHolderBadge } from '../parcel-internal-holder-badge';
import { ParcelStorageFeeBadge } from '../parcel-storage-fee-badge';
import type { useParcelReceiveWorkflow } from './use-parcel-receive-workflow';

function formatDate(value: string | null | undefined) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return formatDateTime(date);
}

export function useParcelReceiveColumns({
  confirmReceive,
  isUpdating,
  triggerScanSuccessFeedback,
}: Pick<
  ReturnType<typeof useParcelReceiveWorkflow>,
  'confirmReceive' | 'isUpdating' | 'triggerScanSuccessFeedback'
>) {
  return useMemo<ColumnDef<ParcelSearchRow>[]>(
    () => [
      {
        id: 'booking',
        header: 'Booking',
        cell: ({ row }) => (
          <div className="space-y-1">
            <span>{row.original.bookingCode}</span>
            <ParcelHandoverNoteAction
              parcelId={row.original.id}
              hasHandoverNote={row.original.hasHandoverNote}
              handoverNoteCritical={row.original.handoverNoteCritical}
            />
            <ParcelStorageFeeBadge storageChargePsw={row.original.storageChargePsw} />
          </div>
        ),
      },
      { accessorKey: 'parcelDetails', header: 'Parcel Details' },
      { accessorKey: 'parcelContent', header: 'Parcel Content' },
      {
        id: 'sender',
        header: 'Sender',
        accessorFn: (row) =>
          `${row.senderName ?? '-'}${row.senderPhone ? ` (${row.senderPhone})` : ''}`,
      },
      {
        id: 'receiver',
        header: 'Receiver',
        accessorFn: (row) =>
          `${row.receiverName ?? '-'}${row.receiverPhone ? ` (${row.receiverPhone})` : ''}`,
      },
      {
        accessorKey: 'createdAt',
        header: 'Created',
        cell: ({ row }) => formatDate(row.original.createdAt),
      },
      {
        id: 'holder',
        header: 'Current Holder',
        cell: ({ row }) => <ParcelInternalHolderBadge holder={row.original} />,
      },
      {
        id: 'actions',
        header: 'Action',
        enableSorting: false,
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon"
                variant="outline"
                aria-label="Parcel actions"
                className="h-8 w-8"
                disabled={isUpdating}
              >
                <EllipsisVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <ViewParcelDetailsMenuItem parcelId={row.original.id} />
              <DropdownMenuItem
                onClick={async () => {
                  try {
                    await confirmReceive(row.original, 'manual');
                    triggerScanSuccessFeedback();
                  } catch (error) {
                    toast.error(
                      getApplicationErrorMessage(error, '') || 'Failed to receive parcel',
                    );
                  }
                }}
              >
                Confirm Receive
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [confirmReceive, isUpdating, triggerScanSuccessFeedback],
  );
}
