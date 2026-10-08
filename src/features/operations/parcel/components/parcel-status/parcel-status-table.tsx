import { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { EllipsisVertical } from 'lucide-react';
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
import { Checkbox } from '@/components/ui/checkbox';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import type { ParcelSearchRow } from '../../api/parcel.api';
import type { PaginationMeta, PaginationRequestDto } from '@/server/types/pagination.types';
import { CallSenderBadge } from '../call-sender-badge';
import { ParcelStorageFeeBadge } from '../parcel-storage-fee-badge';
import { STATUS_LABELS } from './constants';
import { PaymentTypeFilter, type PaymentType } from './payment-type-filter';
import { ParcelStatusSearch } from './parcel-status-search';
import {
  canChangeCallOutcome,
  canReturnToPickup,
  formatCurrency,
  formatPhones,
  formatReceivedAt,
} from './utils';
const DEFAULT_META: PaginationMeta = {
  totalRecords: 0,
  totalPages: 1,
  page: 1,
  pageSize: 20,
  hasNextPage: false,
  hasPreviousPage: false,
};
type ParcelStatusTableProps = {
  rows: ParcelSearchRow[];
  loading: boolean;
  isSaving: boolean;
  companyId: string | null;
  branchId: string | null;
  searchInput: string;
  onSearchInputChange: (value: string) => void;
  onSearchSubmit: () => void;
  onCallOutcome: (parcel: ParcelSearchRow) => void;
  onReturnToPickup: (parcel: ParcelSearchRow) => Promise<void>;
  onMarkCalled: (parcel: ParcelSearchRow) => Promise<void>;
  selectedParcelIds: Set<string>;
  onToggleParcel: (parcelId: string, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
  onBatchCallOutcome: () => void;
  meta?: PaginationMeta;
  onRequestChange: (request: PaginationRequestDto) => void;
  paymentType: PaymentType;
  onPaymentTypeChange: (value: PaymentType) => void;
};
export function ParcelStatusTable({
  rows,
  loading,
  isSaving,
  companyId,
  branchId,
  searchInput,
  onSearchInputChange,
  onSearchSubmit,
  onCallOutcome,
  onReturnToPickup,
  onMarkCalled,
  selectedParcelIds,
  onToggleParcel,
  onSelectAll,
  onBatchCallOutcome,
  meta,
  onRequestChange,
  paymentType,
  onPaymentTypeChange,
}: ParcelStatusTableProps) {
  const selectedCount = rows.filter((row) => selectedParcelIds.has(row.id)).length;
  const columns = useMemo<ColumnDef<ParcelSearchRow>[]>(
    () => [
      {
        id: 'select',
        header: () => (
          <Checkbox
            checked={
              rows.some((row) => canChangeCallOutcome(row.status)) &&
              rows
                .filter((row) => canChangeCallOutcome(row.status))
                .every((row) => selectedParcelIds.has(row.id))
            }
            onCheckedChange={(checked) => onSelectAll(checked === true)}
            aria-label="Select all parcels"
          />
        ),
        enableSorting: false,
        cell: ({ row }) => (
          <Checkbox
            disabled={!canChangeCallOutcome(row.original.status)}
            checked={selectedParcelIds.has(row.original.id)}
            onCheckedChange={(checked) => onToggleParcel(row.original.id, checked === true)}
            aria-label={`Select ${row.original.bookingCode}`}
          />
        ),
      },
      {
        id: 'rowNumber',
        header: 'No.',
        enableSorting: false,
        cell: ({ row }) => (
          <span className="tabular-nums text-muted-foreground">{row.index + 1}</span>
        ),
      },
      {
        id: 'booking',
        header: 'Booking',
        accessorFn: (row) => row.bookingCode,
        cell: ({ row }) => (
          <div className="leading-tight">
            <p className="font-medium">{row.original.bookingCode}</p>
            <p className="text-muted-foreground text-xs">
              Received {formatReceivedAt(row.original.receivedAt)}
            </p>
            <ParcelStorageFeeBadge storageChargePsw={row.original.storageChargePsw} />
          </div>
        ),
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
        id: 'source',
        header: 'Source',
        cell: ({ row }) => (
          <div className="leading-tight">
            <p className="font-medium">{row.original.sourceLocationName ?? '-'}</p>
            <p className="text-muted-foreground text-xs">{row.original.sourceName ?? '-'}</p>
          </div>
        ),
      },
      {
        id: 'destination',
        header: 'Destination',
        cell: ({ row }) => (
          <div className="leading-tight">
            <p className="font-medium">{row.original.pickupLocationName ?? '-'}</p>
            <p className="text-muted-foreground text-xs">{row.original.destinationName ?? '-'}</p>
          </div>
        ),
      },
      {
        id: 'receiverPayment',
        header: 'Receiver Pays',
        cell: ({ row }) =>
          row.original.plannedToBePaidPsw > 0 ? (
            <div className="space-y-1">
              <Badge variant="secondary">Yes</Badge>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(row.original.plannedToBePaidPsw)}
              </p>
            </div>
          ) : (
            <Badge variant="outline">No</Badge>
          ),
      },
      {
        id: 'status',
        header: 'Status',
        accessorFn: (row) => STATUS_LABELS[row.status] ?? String(row.status),
        cell: ({ row }) => {
          const contacted = Boolean(row.original.callCenterCalledAt);
          return (
            <div className="space-y-1">
              <Badge
                variant="outline"
                className={
                  contacted ? 'border-green-600 text-green-600' : 'border-amber-500 text-amber-600'
                }
              >
                {contacted ? 'Contacted' : 'Not Contacted'}
              </Badge>
              <p className="text-xs text-muted-foreground">
                {STATUS_LABELS[row.original.status] ?? String(row.original.status)}
              </p>
            </div>
          );
        },
      },
      {
        id: 'actions',
        header: 'Action',
        enableSorting: false,
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="outline" className="h-8 w-8" disabled={isSaving}>
                <EllipsisVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {canChangeCallOutcome(row.original.status) ? (
                <DropdownMenuItem onClick={() => onCallOutcome(row.original)}>
                  Call Outcome
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuItem onClick={() => void onMarkCalled(row.original)}>
                Mark as Called
              </DropdownMenuItem>
              {canReturnToPickup(row.original.status) ? (
                <DropdownMenuItem onClick={() => void onReturnToPickup(row.original)}>
                  Return to Pickup
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [
      isSaving,
      onCallOutcome,
      onMarkCalled,
      onReturnToPickup,
      onSelectAll,
      onToggleParcel,
      rows,
      selectedParcelIds,
    ],
  );
  return (
    <ScrollableWrapper>
      <Card>
        <CardHeader>
          <CardTitle>Parcel Status (Call Receivers)</CardTitle>
          <CardDescription>
            Assigned parcels stay here after a pickup or delivery choice until marked as called or
            delivered.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ParcelStatusSearch
            value={searchInput}
            onChange={onSearchInputChange}
            onSubmit={onSearchSubmit}
            disabled={!companyId || !branchId}
          />
          <PaymentTypeFilter value={paymentType} onChange={onPaymentTypeChange} />
          {selectedCount > 0 ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {selectedCount} parcel(s) selected
              </span>
              <Button type="button" onClick={onBatchCallOutcome} disabled={isSaving}>
                Call Outcome for Selected
              </Button>
            </div>
          ) : null}
          <DataTable
            mode="server"
            data={rows}
            columns={columns}
            meta={meta ?? DEFAULT_META}
            loading={loading}
            showSearch={false}
            enableVirtualization={false}
            pageSizeOptions={[10, 20, 30, 40, 50]}
            onRequestChange={onRequestChange}
          />
        </CardContent>
      </Card>
    </ScrollableWrapper>
  );
}
