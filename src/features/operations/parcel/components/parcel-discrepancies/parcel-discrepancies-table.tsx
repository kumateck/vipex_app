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
import type { PaginationMeta, PaginationRequestDto } from '@/server/types/pagination.types';
import type { ParcelDiscrepancyRow } from '../../api/parcel.api';
import { discrepancyTypeLabel, formatDiscrepancyDate } from './utils';

type ParcelDiscrepanciesTableProps = {
  data: ParcelDiscrepancyRow[];
  meta: PaginationMeta;
  loading: boolean;
  serverFilters: { companyId?: string; branchId?: string | null };
  branchNameById: Map<string, string>;
  onRequestChange: (
    request: PaginationRequestDto<{ companyId?: string; branchId?: string | null }>,
  ) => void;
  onResolve: (row: ParcelDiscrepancyRow) => void;
  onView: (row: ParcelDiscrepancyRow) => void;
};

export function ParcelDiscrepanciesTable({
  data,
  meta,
  loading,
  serverFilters,
  branchNameById,
  onRequestChange,
  onResolve,
  onView,
}: ParcelDiscrepanciesTableProps) {
  const columns = useMemo<ColumnDef<ParcelDiscrepancyRow>[]>(
    () => [
      { accessorKey: 'bookingCode', header: 'Booking' },
      {
        id: 'type',
        header: 'Type',
        accessorFn: (row) => discrepancyTypeLabel(row.discrepancyType),
      },
      {
        id: 'sender',
        header: 'Sender',
        accessorFn: (row) => row.senderName ?? '-',
      },
      {
        id: 'receiver',
        header: 'Receiver',
        accessorFn: (row) => row.receiverName ?? '-',
      },
      {
        id: 'source',
        header: 'Source',
        accessorFn: (row) => (row.sourceId ? (branchNameById.get(row.sourceId) ?? '-') : '-'),
      },
      {
        id: 'destination',
        header: 'Destination',
        cell: ({ row }) => (
          <div className="leading-tight">
            <p className="font-medium">{row.original.destinationLocationName ?? '-'}</p>
            <p className="text-muted-foreground text-xs">
              {row.original.destinationId
                ? (branchNameById.get(row.original.destinationId) ?? '-')
                : '-'}
            </p>
          </div>
        ),
      },
      {
        accessorKey: 'createdAt',
        header: 'Logged At',
        cell: ({ row }) => formatDiscrepancyDate(row.original.createdAt),
      },
      {
        id: 'actions',
        header: 'Action',
        enableSorting: false,
        cell: ({ row }) => {
          const discrepancy = row.original;
          return (
            <div className="flex items-center justify-end gap-2">
              <Button size="sm" onClick={() => onResolve(discrepancy)}>
                Resolve
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" aria-label="Open discrepancy actions">
                    <EllipsisVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onView(discrepancy)}>
                    View detail
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    [branchNameById, onResolve, onView],
  );

  return (
    <ScrollableWrapper>
      <Card>
        <CardHeader>
          <CardTitle>Parcel Discrepancies</CardTitle>
          <CardDescription>
            Open discrepancy records. Resolving an incoming record-not-physical parcel returns it to
            In Transit (Incoming) for receive confirmation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            mode="server"
            data={data}
            columns={columns}
            meta={meta}
            loading={loading}
            serverFilters={serverFilters}
            onRequestChange={onRequestChange}
            searchPlaceholder="Search tracking, booking, or notes"
            enableVirtualization={false}
          />
        </CardContent>
      </Card>
    </ScrollableWrapper>
  );
}
