import { useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
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
import { Input } from '@/components/ui/input';
import { useGetBranchQuery } from '@/features/branches/api/branches.api';
import { ParcelStatus } from '@/db/schemas/enums';
import { useAuthStore } from '@/stores/auth-store';
import {
  type ParcelSearchRow,
  useCreatePickupQueueMutation,
  useGetParcelDetailsQuery,
  useLazySearchParcelsQuery,
} from '../api/parcel.api';

function formatCurrency(amountPsw: number) {
  return `GHS ${(amountPsw / 100).toFixed(2)}`;
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString();
}

function getPaymentBucketLabel(row: Pick<ParcelSearchRow, 'plannedToBePaidPsw'>) {
  return row.plannedToBePaidPsw > 0 ? 'Receiver Pays' : 'Sender Paid';
}

export function ParcelPickupQueuePage() {
  const user = useAuthStore((state) => state.user);
  const companyId = user?.company?.id ?? null;
  const branchId = user?.branch?.id ?? null;
  const { data: currentBranch } = useGetBranchQuery(branchId ?? '', { skip: !branchId });
  const isPickupQueueEnabled = currentBranch?.usePickupQueue ?? false;

  const [searchInput, setSearchInput] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedParcel, setSelectedParcel] = useState<ParcelSearchRow | null>(null);

  const [createPickupQueue, { isLoading: isCreatingQueue }] = useCreatePickupQueueMutation();
  const [searchParcels, { data: searchResults, isLoading: isSearching }] =
    useLazySearchParcelsQuery();
  const rows = searchResults?.data ?? [];
  const { data: parcelDetails, refetch: refetchParcelDetails } = useGetParcelDetailsQuery(
    selectedParcel?.id ?? '',
    { skip: !selectedParcel?.id },
  );

  const columns = useMemo<ColumnDef<ParcelSearchRow>[]>(
    () => [
      { accessorKey: 'trackingCode', header: 'Tracking' },
      { accessorKey: 'bookingCode', header: 'Booking' },
      {
        id: 'receiver',
        header: 'Customer',
        accessorFn: (row) =>
          `${row.receiverName ?? '-'}${row.receiverPhone ? ` (${row.receiverPhone})` : ''}`,
      },
      { accessorKey: 'parcelDetails', header: 'Parcel Details' },
      {
        id: 'paymentBucket',
        header: 'Payment',
        accessorFn: (row) => getPaymentBucketLabel(row),
      },
      {
        id: 'queue',
        header: 'Queue',
        accessorFn: (row) => row.pickupQueueCode ?? 'Not queued',
      },
      {
        id: 'action',
        header: 'Action',
        enableSorting: false,
        cell: ({ row }) => (
          <Button
            size="sm"
            onClick={() => {
              setSelectedParcel(row.original);
            }}
          >
            {row.original.pickupQueueCode ? 'View Queue' : 'Create Queue'}
          </Button>
        ),
      },
    ],
    [],
  );

  async function handleGenerateQueueTicket() {
    if (!selectedParcel) return;

    const queue = await createPickupQueue({
      parcelId: selectedParcel.id,
    }).unwrap();

    await refetchParcelDetails();
    toast.success(`Queue number ${queue.queueCode} generated`);
  }

  return (
    <div className="w-full space-y-4 p-4">
      <Card>
        <CardHeader>
          <CardTitle>Pickup Queue</CardTitle>
          <CardDescription>
            Search awaiting-pickup parcels at the gate and issue a queue number for service.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isPickupQueueEnabled ? (
            <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
              This branch has not enabled pickup queue yet. Turn on “Use pickup queue” in branch
              settings to use this page.
            </div>
          ) : null}

          <form
            className="flex items-center gap-2"
            onSubmit={async (event) => {
              event.preventDefault();
              const term = searchInput.trim();
              if (!term) {
                toast.error('Enter telephone, booking code, tracking code, or name');
                return;
              }
              if (!companyId || !branchId) return;

              setHasSearched(true);
              try {
                await searchParcels({
                  page: 1,
                  pageSize: 20,
                  search: term,
                  filters: {
                    companyId,
                    destinationId: branchId,
                    status: ParcelStatus.AWAITING_PICKUP,
                  },
                }).unwrap();
              } catch (error) {
                toast.error(error instanceof Error ? error.message : 'Search failed');
              }
            }}
          >
            <Input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search by tracking, booking, telephone, or customer name"
            />
            <Button type="submit" disabled={!isPickupQueueEnabled}>
              Search
            </Button>
          </form>

          {!hasSearched ? (
            <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
              Search for a parcel first. This page does not preload waiting parcels.
            </div>
          ) : (
            <DataTable
              mode="client"
              data={rows}
              columns={columns}
              loading={isSearching}
              showSearch={false}
              enableVirtualization={false}
            />
          )}
        </CardContent>
      </Card>

      <Dialog
        open={Boolean(selectedParcel)}
        onOpenChange={(open) => (!open ? setSelectedParcel(null) : null)}
      >
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Queue Ticket</DialogTitle>
          </DialogHeader>
          {!selectedParcel ? null : (
            <div className="space-y-4">
              <div className="grid gap-2 text-sm">
                <p>
                  <strong>Tracking:</strong> {selectedParcel.trackingCode}
                </p>
                <p>
                  <strong>Booking:</strong> {selectedParcel.bookingCode}
                </p>
                <p>
                  <strong>Customer:</strong> {selectedParcel.receiverName ?? '-'} (
                  {selectedParcel.receiverPhone ?? '-'})
                </p>
                <p>
                  <strong>Parcel:</strong> {selectedParcel.parcelDetails}
                </p>
                <p>
                  <strong>Payment Type:</strong> {getPaymentBucketLabel(selectedParcel)}
                </p>
                <p>
                  <strong>Receiver Due:</strong> {formatCurrency(selectedParcel.plannedToBePaidPsw)}
                </p>
              </div>

              {parcelDetails?.pickupQueue ? (
                <div className="rounded-md border bg-muted/40 p-6 text-center">
                  <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                    Queue Ticket
                  </p>
                  <p className="mt-4 text-7xl font-black tracking-tight">
                    {parcelDetails.pickupQueue.queueCode}
                  </p>
                  <p className="mt-3 text-lg text-muted-foreground">
                    Queue #{parcelDetails.pickupQueue.queueNumber}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Generated {formatDateTime(parcelDetails.pickupQueue.queuedAt)}
                  </p>
                </div>
              ) : (
                <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                  Review the parcel details, then generate the queue ticket.
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => setSelectedParcel(null)}>
              Close
            </Button>
            {!parcelDetails?.pickupQueue ? (
              <Button
                onClick={handleGenerateQueueTicket}
                disabled={isCreatingQueue || !isPickupQueueEnabled}
              >
                Issue Queue Number
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
