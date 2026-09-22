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
import { formatCurrency, formatParcelDate } from './utils';

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
      {
        id: 'reference',
        header: 'Parcel Reference',
        cell: ({ row }) => (
          <div className="space-y-1 text-xs">
            <p>
              <span className="text-muted-foreground">Consignment:</span>{' '}
              {row.original.consignmentCode ?? '-'}
            </p>
            <p>
              <span className="text-muted-foreground">Booking:</span> {row.original.bookingCode}
            </p>
          </div>
        ),
      },
      {
        id: 'dates',
        header: 'Dates',
        cell: ({ row }) => (
          <div className="space-y-1 text-xs">
            <p>
              <span className="text-muted-foreground">Sent D&T:</span>{' '}
              {formatParcelDate(
                row.original.consignmentCreatedAt ??
                  row.original.bookingCreatedAt ??
                  row.original.createdAt,
              )}
            </p>
            <p>
              <span className="text-muted-foreground">Created D&T:</span>{' '}
              {formatParcelDate(row.original.createdAt)}
            </p>
            <p>
              <span className="text-muted-foreground">Received D&T:</span>{' '}
              {formatParcelDate(row.original.receivedAt)}
            </p>
            <p>
              <span className="text-muted-foreground">Delivered D&T:</span>{' '}
              {formatParcelDate(row.original.deliveredAt)}
            </p>
          </div>
        ),
      },
      {
        id: 'customers',
        header: 'Customers',
        cell: ({ row }) => (
          <div className="space-y-1 text-xs">
            <p>
              <span className="text-muted-foreground">Sender:</span>{' '}
              {row.original.senderName ?? '-'}
            </p>
            <p>
              <span className="text-muted-foreground">Tel:</span>{' '}
              {[row.original.senderPhone, row.original.senderPhone2].filter(Boolean).join(' / ') ||
                '-'}
            </p>
            <p>
              <span className="text-muted-foreground">Receiver:</span>{' '}
              {row.original.receiverName ?? '-'}
            </p>
            <p>
              <span className="text-muted-foreground">Tel:</span>{' '}
              {[row.original.receiverPhone, row.original.receiverPhone2]
                .filter(Boolean)
                .join(' / ') || '-'}
            </p>
          </div>
        ),
      },
      {
        id: 'description',
        header: 'Parcel Description',
        cell: ({ row }) => (
          <div className="space-y-1 text-xs">
            <p>
              <span className="text-muted-foreground">Details:</span>{' '}
              {row.original.parcelDetails || '-'}
            </p>
            <p>
              <span className="text-muted-foreground">Content:</span>{' '}
              {row.original.parcelContent || '-'}
            </p>
          </div>
        ),
      },
      {
        id: 'payment',
        header: 'Payment',
        cell: ({ row }) => (
          <div className="space-y-1 text-xs">
            <p>
              <span className="text-muted-foreground">Value:</span>{' '}
              {formatCurrency(row.original.parcelValuePsw)}
            </p>
            <p>
              <span className="text-muted-foreground">Paid:</span>{' '}
              {formatCurrency(row.original.paidPrincipalPsw ?? 0)}
            </p>
            <p>
              <span className="text-muted-foreground">To be paid:</span>{' '}
              {formatCurrency(row.original.plannedToBePaidPsw)}
            </p>
          </div>
        ),
      },
      {
        id: 'route',
        header: 'Route',
        cell: ({ row }) => (
          <div className="space-y-1 text-xs">
            <p>
              <span className="text-muted-foreground">From Branch:</span>{' '}
              {row.original.sourceName ?? '-'}
            </p>
            <p>
              <span className="text-muted-foreground">Location:</span>{' '}
              {row.original.sourceLocationName ?? '-'}
            </p>
            <p>
              <span className="text-muted-foreground">To Branch:</span>{' '}
              {row.original.destinationName ?? '-'}
            </p>
            <p>
              <span className="text-muted-foreground">Location:</span>{' '}
              {row.original.pickupLocationName ?? '-'}
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
