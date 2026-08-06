import { useMemo, useState } from 'react';
import { formatDateTime as sharedFormatDateTime } from '@/lib/dates';
import { format } from 'date-fns';
import { DataTable } from '@/components/datatable';
import type { ColumnDef } from '@tanstack/react-table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import { Label } from '@/components/ui/label';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import type { PaginationMeta } from '@/server/types/pagination.types';
import type { ServerListQuery } from '@/services/rtk-query';
import { useListAuditLogsQuery, type EntityAuditLog } from '@/features/audit/api';

type DeletedParcelAuditRow = {
  id: string;
  createdAt: string;
  bookingCode: string;
  trackingCode: string;
  reason: string;
  paymentTotal: number;
  paymentVoided: number;
  allPaymentsVoided: boolean;
};

const EMPTY_META: PaginationMeta = {
  totalRecords: 0,
  totalPages: 1,
  page: 1,
  pageSize: 20,
  hasNextPage: false,
  hasPreviousPage: false,
};

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return sharedFormatDateTime(value);
}

function getStringValue(record: Record<string, unknown>, key: string) {
  const value = record[key];
  return typeof value === 'string' ? value : '';
}

function getNumberValue(record: Record<string, unknown>, key: string) {
  const value = record[key];
  return typeof value === 'number' ? value : 0;
}

function mapDeletedAuditRows(data: EntityAuditLog[]): DeletedParcelAuditRow[] {
  return data.map((row) => {
    const metadata =
      row.metadata && typeof row.metadata === 'object'
        ? (row.metadata as Record<string, unknown>)
        : {};
    const paymentSummary =
      metadata.paymentSummary && typeof metadata.paymentSummary === 'object'
        ? (metadata.paymentSummary as Record<string, unknown>)
        : {};

    return {
      id: row.id,
      createdAt: row.createdAt,
      bookingCode: getStringValue(metadata, 'bookingCode'),
      trackingCode: getStringValue(metadata, 'trackingCode'),
      reason: getStringValue(metadata, 'reason'),
      paymentTotal: getNumberValue(paymentSummary, 'totalPayments'),
      paymentVoided: getNumberValue(paymentSummary, 'totalVoidedPayments'),
      allPaymentsVoided: Boolean(paymentSummary.allPaymentsVoided),
    };
  });
}

export default function DeletedParcelAuditPage() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [query, setQuery] = useState<ServerListQuery>({
    page: 1,
    pageSize: 20,
    filters: {
      entityType: 'parcel',
      action: 'PARCEL_SOFT_DELETED',
    },
  });

  const { data, isLoading } = useListAuditLogsQuery(query);

  const rows = useMemo(() => mapDeletedAuditRows(data?.data ?? []), [data?.data]);

  const columns = useMemo<ColumnDef<DeletedParcelAuditRow>[]>(
    () => [
      { accessorKey: 'trackingCode', header: 'Tracking' },
      { accessorKey: 'bookingCode', header: 'Booking' },
      {
        accessorKey: 'reason',
        header: 'Deletion Reason',
        cell: ({ row }) => row.original.reason || '-',
      },
      {
        id: 'paymentStatus',
        header: 'Payment Delete Status',
        cell: ({ row }) => {
          const item = row.original;
          if (item.paymentTotal === 0) return 'No linked payment';
          return `${item.paymentVoided}/${item.paymentTotal} voided${item.allPaymentsVoided ? ' (all)' : ''}`;
        },
      },
      {
        id: 'createdAtLabel',
        header: 'Deleted At',
        accessorFn: (row) => formatDateTime(row.createdAt),
      },
    ],
    [],
  );

  return (
    <div className="w-full p-4 space-y-4">
      <ScrollableWrapper>
        <Card>
          <CardHeader>
            <CardTitle>Deleted Parcels Audit</CardTitle>
            <CardDescription>
              Soft-deleted parcels with deletion reason and linked payment deletion status.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="audit-deleted-from">From</Label>
                <DatePicker
                  date={from ? new Date(`${from}T00:00:00`) : undefined}
                  onDateChange={(date) => setFrom(date ? format(date, 'yyyy-MM-dd') : '')}
                  placeholder="Select start date"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="audit-deleted-to">To</Label>
                <DatePicker
                  date={to ? new Date(`${to}T00:00:00`) : undefined}
                  onDateChange={(date) => setTo(date ? format(date, 'yyyy-MM-dd') : '')}
                  placeholder="Select end date"
                />
              </div>
            </div>

            <DataTable
              mode="server"
              data={rows}
              columns={columns}
              meta={data?.meta ?? EMPTY_META}
              loading={isLoading}
              serverFilters={{
                entityType: 'parcel',
                action: 'PARCEL_SOFT_DELETED',
                from: from ? `${from}T00:00:00.000` : undefined,
                to: to ? `${to}T23:59:59.999` : undefined,
              }}
              onRequestChange={setQuery}
              searchPlaceholder="Search by action/message"
              enableVirtualization={false}
            />
          </CardContent>
        </Card>
      </ScrollableWrapper>
    </div>
  );
}
