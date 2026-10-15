import { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/datatable';
import { formatDateTime } from '@/lib/dates';
import type {
  DailyParcelAuditRow,
  DailyParcelAuditView,
} from '../../types/daily-parcel-audit.types';
import { formatMoneyPsw } from '../../utils/daily-parcel-audit.utils';

export function DailyParcelAuditTable({
  rows,
  view,
}: {
  rows: DailyParcelAuditRow[];
  view: DailyParcelAuditView;
}) {
  const columns = useMemo<ColumnDef<DailyParcelAuditRow>[]>(
    () => [
      {
        id: 'booking',
        header: 'Booking / Tracking',
        accessorFn: (row) => `${row.bookingCode} ${row.trackingCode}`,
        cell: ({ row }) => (
          <>
            <div className="font-medium">{row.original.bookingCode}</div>
            <div className="text-xs text-muted-foreground">{row.original.trackingCode}</div>
          </>
        ),
      },
      {
        id: 'receiver',
        header: 'Receiver',
        accessorFn: (row) => `${row.receiverName} ${row.receiverTelephone ?? ''}`,
        cell: ({ row }) => (
          <>
            <div>{row.original.receiverName || '-'}</div>
            <div className="text-xs text-muted-foreground">
              {row.original.receiverTelephone || '-'}
            </div>
          </>
        ),
      },
      {
        id: 'parcel',
        header: 'Parcel',
        accessorFn: (row) => `${row.parcelDetails} ${row.parcelContent}`,
        cell: ({ row }) => (
          <>
            <div>{row.original.parcelDetails || '-'}</div>
            <div className="text-xs text-muted-foreground">{row.original.parcelContent || '-'}</div>
          </>
        ),
      },
      { accessorKey: 'sourceBranchName', header: 'Branch' },
      {
        id: 'charge',
        header: 'Charge',
        accessorFn: (row) => row.chargePsw,
        cell: ({ row }) => formatMoneyPsw(row.original.chargePsw),
      },
      {
        id: 'paid',
        header: view === 'receiver' ? 'Receiver paid / due' : 'Sender paid',
        accessorFn: (row) => (view === 'receiver' ? row.receiverPaidPsw : row.senderPaidPsw),
        cell: ({ row }) =>
          view === 'receiver' ? (
            <>
              <div>{formatMoneyPsw(row.original.receiverPaidPsw)} paid</div>
              <div className="text-xs text-muted-foreground">
                {formatMoneyPsw(row.original.receiverCreditedPsw)} credit ·{' '}
                {formatMoneyPsw(row.original.receiverOutstandingPsw)} due
              </div>
            </>
          ) : (
            formatMoneyPsw(row.original.senderPaidPsw)
          ),
      },
      { accessorKey: 'paymentStatus', header: 'Receiver payment' },
      {
        id: 'delivery',
        header: 'Delivery',
        accessorFn: (row) => row.deliveredAt ?? '',
        cell: ({ row }) =>
          row.original.isDelivered
            ? row.original.deliveredAt
              ? formatDateTime(row.original.deliveredAt)
              : 'Delivered'
            : 'Pending',
      },
      {
        id: 'officer',
        header: 'Officer / Cashier',
        accessorFn: (row) =>
          `${row.deliveryOfficer ?? ''} ${view === 'receiver' ? (row.receiverCashier ?? '') : (row.senderCashier ?? '')}`,
        cell: ({ row }) => (
          <>
            <div>{row.original.deliveryOfficer || '-'}</div>
            <div className="text-xs text-muted-foreground">
              Cashier:{' '}
              {view === 'receiver'
                ? row.original.receiverCashier || '-'
                : row.original.senderCashier || '-'}
            </div>
          </>
        ),
      },
    ],
    [view],
  );
  return (
    <DataTable
      mode="client"
      data={rows}
      columns={columns}
      initialPageSize={25}
      showSearch={false}
      emptyMessage="No parcels match these filters."
      enableVirtualization={false}
    />
  );
}
