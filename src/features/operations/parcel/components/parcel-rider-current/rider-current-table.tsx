import { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { EllipsisVertical } from 'lucide-react';
import { DataTable } from '@/components/datatable';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import type { RiderDoorstepRecord } from '../../api/parcel.api';
import { CallSenderBadge } from '../call-sender-badge';

type RiderCurrentTableProps = {
  data:
    | {
        rows: RiderDoorstepRecord[];
        totals: { expectedDeliveryFeePsw: number; expectedToBePaidPsw: number };
      }
    | undefined;
  isReturning: boolean;
  pendingParcelIds: Set<string>;
  onOpenDeliveryDetails: (row: RiderDoorstepRecord) => void;
  onRequestChange: (row: RiderDoorstepRecord) => void;
  onReturn: (row: RiderDoorstepRecord) => Promise<void>;
};

export function RiderCurrentTable({
  data,
  isReturning,
  pendingParcelIds,
  onOpenDeliveryDetails,
  onRequestChange,
  onReturn,
}: RiderCurrentTableProps) {
  const columns = useMemo<ColumnDef<RiderDoorstepRecord>[]>(
    () => [
      { accessorKey: 'bookingCode', header: 'Booking' },
      { accessorKey: 'parcelDetails', header: 'Parcel Details' },
      {
        id: 'receiver',
        header: 'Receiver',
        accessorFn: (row) =>
          `${row.receiverName ?? '-'}${row.receiverPhone ? ` (${row.receiverPhone})` : ''}`,
        cell: ({ row }) => (
          <div className="leading-tight">
            <div className="flex items-center gap-1.5">
              <p>{row.original.receiverName ?? '-'}</p>
              {row.original.callSender ? (
                <CallSenderBadge className="h-5 px-1.5 text-[10px]" />
              ) : null}
            </div>
            {row.original.receiverPhone ? (
              <p className="text-xs text-muted-foreground">{row.original.receiverPhone}</p>
            ) : null}
          </div>
        ),
      },
      {
        id: 'changeRequest',
        header: 'Change Request',
        accessorFn: (row) => (pendingParcelIds.has(row.parcelId) ? 'Pending review' : '-'),
      },
      {
        id: 'action',
        header: 'Action',
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="outline" className="h-8 w-8" disabled={isReturning}>
                <EllipsisVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                disabled={pendingParcelIds.has(row.original.parcelId)}
                onClick={() => onOpenDeliveryDetails(row.original)}
              >
                {pendingParcelIds.has(row.original.parcelId)
                  ? 'Awaiting change review'
                  : 'Delivery Details'}
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={pendingParcelIds.has(row.original.parcelId)}
                onClick={() => onRequestChange(row.original)}
              >
                Request Address/Fee Change
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => void onReturn(row.original)}>
                Return
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [isReturning, onOpenDeliveryDetails, onRequestChange, onReturn, pendingParcelIds],
  );

  return (
    <ScrollableWrapper>
      <Card>
        <CardHeader>
          <CardTitle>Rider Current Deliveries</CardTitle>
          <CardDescription>
            Current dispatched parcels assigned to you. Confirm signature on handover.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2 text-sm">
            <p>
              <strong>Expected Delivery Fee:</strong> GHS{' '}
              {((data?.totals.expectedDeliveryFeePsw ?? 0) / 100).toFixed(2)}
            </p>
            <p>
              <strong>Expected To Be Paid:</strong> GHS{' '}
              {((data?.totals.expectedToBePaidPsw ?? 0) / 100).toFixed(2)}
            </p>
          </div>
          <DataTable
            mode="client"
            data={data?.rows ?? []}
            columns={columns}
            loading={false}
            enableVirtualization={false}
          />
        </CardContent>
      </Card>
    </ScrollableWrapper>
  );
}
