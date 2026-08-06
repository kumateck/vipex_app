import { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { EllipsisVertical, Search } from 'lucide-react';
import { DataTable } from '@/components/datatable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import type { PaginationMeta, PaginationRequestDto } from '@/server/types/pagination.types';
import type { ParcelSearchRow } from '../../api/parcel.api';
import { EMPTY_META, PARCEL_STATUS_LABELS } from './constants';
import type { ParcelSuperSearchFilters } from './types';

type ParcelSuperSearchTableProps = {
  companyId: string | null;
  shouldSearch: boolean;
  searchInput: string;
  onSearchInputChange: (value: string) => void;
  onSearchSubmit: () => void;
  rows: ParcelSearchRow[];
  meta: PaginationMeta | undefined;
  loading: boolean;
  branchNameById: Map<string, string>;
  onRequestChange: (request: PaginationRequestDto<ParcelSuperSearchFilters>) => void;
  onViewDetails: (parcelId: string) => void;
};

export function ParcelSuperSearchTable({
  companyId,
  shouldSearch,
  searchInput,
  onSearchInputChange,
  onSearchSubmit,
  rows,
  meta,
  loading,
  branchNameById,
  onRequestChange,
  onViewDetails,
}: ParcelSuperSearchTableProps) {
  const columns = useMemo<ColumnDef<ParcelSearchRow>[]>(
    () => [
      { accessorKey: 'bookingCode', header: 'Booking' },
      {
        id: 'sender',
        header: 'Sender',
        cell: ({ row }) => (
          <div className="leading-tight">
            <p className="font-medium">{row.original.senderName ?? '-'}</p>
            <p className="text-xs text-muted-foreground">{row.original.senderPhone ?? '-'}</p>
          </div>
        ),
      },
      {
        id: 'receiver',
        header: 'Receiver',
        cell: ({ row }) => (
          <div className="leading-tight">
            <p className="font-medium">{row.original.receiverName ?? '-'}</p>
            <p className="text-xs text-muted-foreground">{row.original.receiverPhone ?? '-'}</p>
          </div>
        ),
      },
      {
        id: 'source',
        header: 'Source',
        cell: ({ row }) => (
          <div className="leading-tight">
            <p className="font-medium">{row.original.sourceLocationName ?? '-'}</p>
            <p className="text-xs text-muted-foreground">
              {branchNameById.get(row.original.sourceId) ?? row.original.sourceName ?? '-'}
            </p>
          </div>
        ),
      },
      {
        id: 'destination',
        header: 'Destination',
        cell: ({ row }) => (
          <div className="leading-tight">
            <p className="font-medium">{row.original.pickupLocationName ?? '-'}</p>
            <p className="text-xs text-muted-foreground">
              {branchNameById.get(row.original.destinationId) ??
                row.original.destinationName ??
                '-'}
            </p>
          </div>
        ),
      },
      {
        id: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <Badge variant="secondary">
            {PARCEL_STATUS_LABELS[row.original.status] ?? `Status ${row.original.status}`}
          </Badge>
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
              <DropdownMenuItem onClick={() => onViewDetails(row.original.id)}>
                View Details
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [branchNameById, onViewDetails],
  );

  return (
    <ScrollableWrapper>
      <Card>
        <CardHeader>
          <CardTitle>All Parcels Super Search</CardTitle>
          <CardDescription>
            Search by sender/receiver name or phone, booking code, or tracking code.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            className="flex items-center gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              if (!companyId || searchInput.trim().length === 0) return;
              onSearchSubmit();
            }}
          >
            <Input
              value={searchInput}
              onChange={(event) => onSearchInputChange(event.target.value)}
              placeholder="Enter sender/receiver name, telephone, booking code, or tracking code"
              className="h-11 text-base"
            />
            <Button
              type="submit"
              className="h-11 px-6"
              onClick={onSearchSubmit}
              disabled={!companyId || searchInput.trim().length === 0}
            >
              <Search className="mr-2 h-4 w-4" />
              Search
            </Button>
          </form>

          {shouldSearch ? (
            <DataTable
              mode="server"
              data={rows}
              columns={columns}
              meta={meta ?? EMPTY_META}
              loading={loading}
              showSearch={false}
              serverFilters={{ companyId, includeDeleted: true }}
              onRequestChange={onRequestChange}
              enableVirtualization={false}
            />
          ) : (
            <div className="rounded-md border border-dashed p-8 text-center text-muted-foreground">
              Enter a search term and click Search to see parcel records.
            </div>
          )}
        </CardContent>
      </Card>
    </ScrollableWrapper>
  );
}
