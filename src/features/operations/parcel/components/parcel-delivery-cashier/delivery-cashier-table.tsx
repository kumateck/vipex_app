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
import { Input } from '@/components/ui/input';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { ParcelStatus } from '@/db/schemas/enums';
import { formatDateTime } from '@/lib/dates';
import type { PaginationMeta, PaginationRequestDto } from '@/server/types/pagination.types';
import type { ParcelSearchRow } from '../../api/parcel.api';
import { CallSenderBadge } from '../call-sender-badge';
import { EMPTY_META } from './constants';
import { formatMoney, formatPhones } from './utils';

type DeliveryCashierTableProps = {
  companyId: string | null;
  branchId: string | null;
  searchInput: string;
  onSearchInputChange: (value: string) => void;
  onSearchSubmit: () => void;
  data: ParcelSearchRow[];
  meta: PaginationMeta | undefined;
  loading: boolean;
  onRequestChange: (
    request: PaginationRequestDto<{
      companyId?: string | null;
      destinationId?: string | null;
      status?: number | null;
    }>,
  ) => void;
  onFinalize: (parcel: ParcelSearchRow) => void;
};

export function DeliveryCashierTable({
  companyId,
  branchId,
  searchInput,
  onSearchInputChange,
  onSearchSubmit,
  data,
  meta,
  loading,
  onRequestChange,
  onFinalize,
}: DeliveryCashierTableProps) {
  const columns = useMemo<ColumnDef<ParcelSearchRow>[]>(
    () => [
      { accessorKey: 'bookingCode', header: 'Booking' },
      {
        id: 'receiver',
        header: 'Receiver',
        cell: ({ row }) => (
          <div className="space-y-1 leading-tight">
            <div>
              <div className="flex items-center gap-1.5">
                <div>{row.original.receiverName ?? '-'}</div>
                {row.original.callSender ? (
                  <CallSenderBadge className="h-5 px-1.5 text-[10px]" />
                ) : null}
              </div>
              <div className="text-xs text-muted-foreground">
                {formatPhones(row.original.receiverPhone, row.original.receiverPhone2)}
              </div>
            </div>
            {row.original.secondReceiverName ? (
              <div>
                <div className="text-xs font-medium text-muted-foreground">Second receiver</div>
                <div>{row.original.secondReceiverName}</div>
                <div className="text-xs text-muted-foreground">
                  {formatPhones(
                    row.original.secondReceiverPhone,
                    row.original.secondReceiverPhone2,
                  )}
                </div>
              </div>
            ) : null}
          </div>
        ),
      },
      {
        id: 'assignedRider',
        header: 'Assigned Rider',
        accessorFn: (row) => row.riderName ?? 'Unassigned',
      },
      {
        id: 'address',
        header: 'Address',
        accessorFn: (row) => row.dropoffAddress ?? '-',
      },
      {
        id: 'deliveryFee',
        header: 'Delivery Fee',
        accessorFn: (row) => formatMoney(row.deliveryFeePsw ?? 0),
      },
      {
        id: 'toBePaid',
        header: 'To Be Paid',
        accessorFn: (row) =>
          row.plannedToBePaidPsw > 0 ? formatMoney(row.plannedToBePaidPsw) : '-',
      },
      {
        id: 'deliveryAt',
        header: 'Delivery At',
        accessorFn: (row) => (row.confirmedAt ? formatDateTime(row.confirmedAt) : '-'),
      },
      {
        id: 'action',
        header: 'Action',
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="outline" className="h-8 w-8">
                <EllipsisVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onFinalize(row.original)}>Finalize</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [onFinalize],
  );

  return (
    <ScrollableWrapper>
      <Card>
        <CardHeader>
          <CardTitle>Delivery Cashier Finalization</CardTitle>
          <CardDescription>
            Receive rider money for successful handovers and finalize to delivered at home.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            className="flex items-center gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              onSearchSubmit();
            }}
          >
            <Input
              value={searchInput}
              onChange={(event) => onSearchInputChange(event.target.value)}
              placeholder="Search by tracking, booking, receiver"
            />
            <Button type="submit">Search</Button>
          </form>
          <DataTable
            mode="server"
            data={data}
            columns={columns}
            meta={meta ?? EMPTY_META}
            loading={loading}
            showSearch={false}
            serverFilters={{
              companyId,
              destinationId: branchId,
              status: ParcelStatus.RIDER_GIVEN_PARCEL_TO_CUSTOMER,
            }}
            onRequestChange={onRequestChange}
            enableVirtualization={false}
          />
        </CardContent>
      </Card>
    </ScrollableWrapper>
  );
}
