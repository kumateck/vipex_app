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
import { ParcelStatus } from '@/db/schemas/enums';
import type { PaginationMeta, PaginationRequestDto } from '@/server/types/pagination.types';
import type { SenderCashierParcel } from '../../api/parcel.api';
import { EMPTY_META, PAYMENT_TYPE_LEGEND } from './constants';
import {
  formatCurrency,
  formatPhones,
  formatSenderParcelDate,
  getPaymentType,
  getSenderDuePsw,
} from './utils';

type SenderPaymentsTableProps = {
  data: SenderCashierParcel[];
  meta: PaginationMeta | undefined;
  loading: boolean;
  companyId: string | null;
  branchId: string | null;
  canDeleteParcel: boolean;
  canRequestReconciliation: boolean;
  onRequestChange: (
    request: PaginationRequestDto<{
      companyId?: string | null;
      sourceId?: string | null;
      status?: number | null;
    }>,
  ) => void;
  onOpenCollectPayment: (parcel: SenderCashierParcel) => void;
  onOpenDeleteParcel: (parcel: SenderCashierParcel) => void;
  onOpenReconciliationCase: (parcel: SenderCashierParcel) => void;
};

export function SenderPaymentsTable({
  data,
  meta,
  loading,
  companyId,
  branchId,
  canDeleteParcel,
  canRequestReconciliation,
  onRequestChange,
  onOpenCollectPayment,
  onOpenDeleteParcel,
  onOpenReconciliationCase,
}: SenderPaymentsTableProps) {
  const columns = useMemo<ColumnDef<SenderCashierParcel>[]>(
    () => [
      {
        accessorKey: 'bookingCode',
        header: 'Booking',
        cell: ({ row }) => {
          const paymentType = getPaymentType(row.original);
          return (
            <div className="inline-flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${paymentType.dotClassName}`} />
              <span>{row.original.bookingCode}</span>
            </div>
          );
        },
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
            <p className="font-medium">{row.original.receiverName ?? '-'}</p>
            <p className="text-muted-foreground text-xs">
              {formatPhones(row.original.receiverPhone, row.original.receiverPhone2)}
            </p>
          </div>
        ),
      },
      {
        id: 'charge',
        header: 'Charge',
        accessorFn: (row) => formatCurrency(row.chargePsw),
      },
      {
        id: 'createdAtLabel',
        header: 'Created At',
        accessorFn: (row) => formatSenderParcelDate(row.createdAt),
      },
      {
        id: 'destination',
        header: 'Destination',
        cell: ({ row }) => (
          <div className="leading-tight">
            <p className="font-medium">
              {row.original.pickupLocationName ?? row.original.pickupLocationId ?? '-'}
            </p>
            <p className="text-muted-foreground text-xs">
              {row.original.destinationName ?? row.original.destinationId}
            </p>
          </div>
        ),
      },
      {
        id: 'actions',
        header: 'Action',
        enableSorting: false,
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="outline" className="h-8 w-8">
                <EllipsisVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onOpenCollectPayment(row.original)}>
                {getSenderDuePsw(row.original) > 0 ? 'Collect Payment' : 'Print Receipts'}
              </DropdownMenuItem>
              {canDeleteParcel ? (
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => onOpenDeleteParcel(row.original)}
                >
                  Delete Parcel
                </DropdownMenuItem>
              ) : null}
              {canRequestReconciliation ? (
                <DropdownMenuItem onClick={() => onOpenReconciliationCase(row.original)}>
                  Open Reconciliation Case
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [
      canDeleteParcel,
      canRequestReconciliation,
      onOpenCollectPayment,
      onOpenDeleteParcel,
      onOpenReconciliationCase,
    ],
  );

  return (
    <ScrollableWrapper>
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>Sender Cashier Payments</CardTitle>
              <CardDescription>
                Parcels created at your branch and ready for sender payment collection.
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {PAYMENT_TYPE_LEGEND.map((item) => (
                <div key={item.label} className="inline-flex items-center gap-1.5">
                  <span className={`h-2.5 w-2.5 rounded-full ${item.dotClassName}`} />
                  <span className="text-muted-foreground text-xs">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            mode="server"
            data={data}
            columns={columns}
            meta={meta ?? EMPTY_META}
            loading={loading}
            serverFilters={{ companyId, sourceId: branchId, status: ParcelStatus.CREATED }}
            onRequestChange={onRequestChange}
            searchPlaceholder="Search by tracking, booking, sender or receiver"
            enableVirtualization={false}
          />
        </CardContent>
      </Card>
    </ScrollableWrapper>
  );
}
