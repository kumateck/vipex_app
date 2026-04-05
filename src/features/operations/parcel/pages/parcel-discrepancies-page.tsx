import { useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { EllipsisVertical } from 'lucide-react';
import { toast } from 'sonner';
import { DataTable } from '@/components/datatable';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { formatDateTime } from '@/lib/date';
import { useAuthStore } from '@/stores/auth-store';
import type { PaginationMeta } from '@/server/types/pagination.types';
import type { ServerListQuery } from '@/services/rtk-query';
import {
  type ParcelDiscrepancyRow,
  useListOpenParcelDiscrepanciesQuery,
  useResolveParcelDiscrepancyMutation,
} from '../api/parcel.api';
import { useListBranchOptionsQuery } from '@/features/branches/api/branches.api';

const EMPTY_META: PaginationMeta = {
  totalRecords: 0,
  totalPages: 1,
  page: 1,
  pageSize: 20,
  hasNextPage: false,
  hasPreviousPage: false,
};

function formatDate(value: string | null | undefined) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return formatDateTime(date);
}

export function ParcelDiscrepanciesPage() {
  const user = useAuthStore((state) => state.user);
  const companyId = user?.company?.id ?? null;
  const branchId = user?.branch?.id ?? null;

  const serverFilters = useMemo(
    () => ({ companyId: companyId ?? undefined, branchId: branchId ?? undefined }),
    [branchId, companyId],
  );

  const [query, setQuery] = useState<
    ServerListQuery<{ companyId?: string; branchId?: string | null }>
  >({
    page: 1,
    pageSize: 20,
    filters: serverFilters,
  });

  const { data, isLoading, refetch } = useListOpenParcelDiscrepanciesQuery(query, {
    skip: !companyId,
  });
  const [resolveDiscrepancy, { isLoading: isResolving }] = useResolveParcelDiscrepancyMutation();
  const { data: branchOptions = [] } = useListBranchOptionsQuery(
    { companyId },
    { skip: !companyId },
  );

  const branchNameById = useMemo(
    () => new Map(branchOptions.map((branch) => [branch.id, branch.name])),
    [branchOptions],
  );

  const [resolvingRow, setResolvingRow] = useState<ParcelDiscrepancyRow | null>(null);
  const [viewingRow, setViewingRow] = useState<ParcelDiscrepancyRow | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');

  const columns = useMemo<ColumnDef<ParcelDiscrepancyRow>[]>(
    () => [
      { accessorKey: 'trackingCode', header: 'Tracking' },
      { accessorKey: 'bookingCode', header: 'Booking' },
      {
        id: 'type',
        header: 'Type',
        accessorFn: (row) =>
          row.discrepancyType === 'record_not_physical'
            ? 'Record Not Physical'
            : 'Physical Missing',
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
        cell: ({ row }) => formatDate(row.original.createdAt),
      },
      {
        id: 'actions',
        header: 'Action',
        enableSorting: false,
        cell: ({ row }) => {
          const discrepancy = row.original;
          return (
            <div className="flex items-center justify-end gap-2">
              <Button
                size="sm"
                onClick={() => {
                  setResolvingRow(discrepancy);
                  setResolutionNote('');
                }}
              >
                Resolve
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" aria-label="Open discrepancy actions">
                    <EllipsisVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setViewingRow(discrepancy)}>
                    View detail
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    [branchNameById],
  );

  return (
    <div className="w-full p-4 space-y-4">
      <ScrollableWrapper>
        <Card>
          <CardHeader>
            <CardTitle>Parcel Discrepancies</CardTitle>
            <CardDescription>
              Open discrepancy records. Resolving an incoming record-not-physical parcel returns it
              to In Transit (Incoming) for receive confirmation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              mode="server"
              data={data?.data ?? []}
              columns={columns}
              meta={data?.meta ?? EMPTY_META}
              loading={isLoading}
              serverFilters={serverFilters}
              onRequestChange={setQuery}
              searchPlaceholder="Search tracking, booking, or notes"
              enableVirtualization={false}
            />
          </CardContent>
        </Card>
      </ScrollableWrapper>

      <Dialog
        open={Boolean(viewingRow)}
        onOpenChange={(open) => (!open ? setViewingRow(null) : null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Discrepancy Detail</DialogTitle>
          </DialogHeader>

          <div className="space-y-2 text-sm">
            <p>
              <strong>Tracking:</strong> {viewingRow?.trackingCode ?? '-'}
            </p>
            <p>
              <strong>Booking:</strong> {viewingRow?.bookingCode ?? '-'}
            </p>
            <p>
              <strong>Type:</strong>{' '}
              {viewingRow?.discrepancyType === 'record_not_physical'
                ? 'Record Not Physical'
                : 'Physical Missing'}
            </p>
            <p>
              <strong>Source:</strong>{' '}
              {viewingRow?.sourceId ? (branchNameById.get(viewingRow.sourceId) ?? '-') : '-'}
            </p>
            <p>
              <strong>Destination:</strong> {viewingRow?.destinationLocationName ?? '-'} /{' '}
              {viewingRow?.destinationId
                ? (branchNameById.get(viewingRow.destinationId) ?? '-')
                : '-'}
            </p>
            <p>
              <strong>Logged At:</strong> {formatDate(viewingRow?.createdAt)}
            </p>
            <p>
              <strong>Notes:</strong> {viewingRow?.notes?.trim() || '-'}
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewingRow(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(resolvingRow)}
        onOpenChange={(open) => (!open ? setResolvingRow(null) : null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Discrepancy</DialogTitle>
          </DialogHeader>

          <div className="space-y-2 text-sm">
            <p>
              <strong>Tracking:</strong> {resolvingRow?.trackingCode ?? '-'}
            </p>
            <p>
              <strong>Booking:</strong> {resolvingRow?.bookingCode ?? '-'}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="resolution-note">Resolution Note</Label>
            <Input
              id="resolution-note"
              value={resolutionNote}
              onChange={(event) => setResolutionNote(event.target.value)}
              placeholder="Optional note"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setResolvingRow(null)}>
              Cancel
            </Button>
            <Button
              disabled={isResolving || !resolvingRow}
              onClick={async () => {
                if (!resolvingRow) return;
                try {
                  await resolveDiscrepancy({
                    id: resolvingRow.id,
                    resolutionNote: resolutionNote.trim() || null,
                  }).unwrap();
                  toast.success('Discrepancy resolved');
                  setResolvingRow(null);
                  await refetch();
                } catch (error) {
                  toast.error(
                    error instanceof Error ? error.message : 'Failed to resolve discrepancy',
                  );
                }
              }}
            >
              {isResolving ? 'Resolving...' : 'Resolve'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
