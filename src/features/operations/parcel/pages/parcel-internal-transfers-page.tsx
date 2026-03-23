import { useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';
import { DataTable } from '@/components/datatable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useListLocationOptionsQuery } from '@/features/locations/api/locations.api';
import { useListWarehouseOptionsQuery } from '@/features/warehouses';
import { ParcelHolderType, ParcelInternalTransferStatus } from '@/db/schemas/enums';
import { PermissionKeys } from '@/shared/permissions/constants';
import { useAuthStore } from '@/stores/auth-store';
import {
  type ParcelInternalTransferRow,
  type ParcelSearchRow,
  useCancelParcelInternalTransferMutation,
  useCreateParcelInternalTransferMutation,
  useGetParcelInternalTransferDetailsQuery,
  useLazySearchParcelsQuery,
  useListParcelInternalTransfersQuery,
} from '../api/parcel.api';
import { ParcelInternalHolderBadge } from '../components/parcel-internal-holder-badge';
import { printParcelInternalTransferSlip } from '../utils/internal-transfer-print';

function holderTypeLabel(value: number) {
  switch (value) {
    case ParcelHolderType.BRANCH:
      return 'Main Branch';
    case ParcelHolderType.LOCATION:
      return 'Location';
    case ParcelHolderType.WAREHOUSE:
      return 'Warehouse';
    default:
      return `Holder ${value}`;
  }
}

function transferStatusLabel(value: number) {
  switch (value) {
    case ParcelInternalTransferStatus.PENDING:
      return 'Pending';
    case ParcelInternalTransferStatus.ACKNOWLEDGED:
      return 'Acknowledged';
    case ParcelInternalTransferStatus.CANCELLED:
      return 'Cancelled';
    default:
      return `Status ${value}`;
  }
}

function holderSummary(
  row: Pick<
    ParcelInternalTransferRow,
    | 'sourceHolderType'
    | 'sourceLocationName'
    | 'sourceWarehouseName'
    | 'destinationHolderType'
    | 'destinationLocationName'
    | 'destinationWarehouseName'
  >,
  side: 'source' | 'destination',
) {
  const type = side === 'source' ? row.sourceHolderType : row.destinationHolderType;
  const name =
    side === 'source'
      ? (row.sourceLocationName ?? row.sourceWarehouseName)
      : (row.destinationLocationName ?? row.destinationWarehouseName);
  return name ? `${holderTypeLabel(type)}: ${name}` : holderTypeLabel(type);
}

export function ParcelInternalTransfersPage() {
  const user = useAuthStore((state) => state.user);
  const companyId = user?.company?.id ?? '';
  const branchId = user?.branch?.id ?? '';
  const defaultLocationId = user?.location?.id ?? '';
  const canCreate = user?.permissions?.includes(PermissionKeys.CanCreateParcelInternalTransfers);
  const canRead = user?.permissions?.includes(PermissionKeys.CanReadParcelInternalTransfers);
  const canCancel = user?.permissions?.includes(PermissionKeys.CanCancelParcelInternalTransfers);

  const [sourceHolderType, setSourceHolderType] = useState(
    defaultLocationId ? String(ParcelHolderType.LOCATION) : String(ParcelHolderType.BRANCH),
  );
  const [sourceLocationId, setSourceLocationId] = useState(defaultLocationId);
  const [sourceWarehouseId, setSourceWarehouseId] = useState('');
  const [destinationHolderType, setDestinationHolderType] = useState(
    String(ParcelHolderType.LOCATION),
  );
  const [destinationLocationId, setDestinationLocationId] = useState('');
  const [destinationWarehouseId, setDestinationWarehouseId] = useState('');
  const [notes, setNotes] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedParcels, setSelectedParcels] = useState<ParcelSearchRow[]>([]);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelTransferId, setCancelTransferId] = useState('');
  const [selectedHistoryTransferId, setSelectedHistoryTransferId] = useState('');

  const { data: locationOptions = [] } = useListLocationOptionsQuery(
    { companyId, branchId },
    { skip: !companyId || !branchId },
  );
  const { data: warehouseOptions = [] } = useListWarehouseOptionsQuery(
    { companyId, branchId, activeOnly: true },
    { skip: !companyId || !branchId },
  );

  const [searchParcels, { data: searchResults, isFetching: isSearching }] =
    useLazySearchParcelsQuery();
  const {
    data: transfers = [],
    refetch: refetchTransfers,
    isFetching: isFetchingTransfers,
  } = useListParcelInternalTransfersQuery({ branchId }, { skip: !branchId || !canRead });
  const { data: selectedHistoryDetails, isFetching: isFetchingHistoryDetails } =
    useGetParcelInternalTransferDetailsQuery(selectedHistoryTransferId, {
      skip: !selectedHistoryTransferId,
    });
  const [createTransfer, { isLoading: isCreating }] = useCreateParcelInternalTransferMutation();
  const [cancelTransfer, { isLoading: isCancelling }] = useCancelParcelInternalTransferMutation();

  const selectedParcelIds = useMemo(
    () => new Set(selectedParcels.map((parcel) => parcel.id)),
    [selectedParcels],
  );
  const transferCounts = useMemo(
    () => ({
      pending: transfers.filter(
        (transfer) => transfer.status === ParcelInternalTransferStatus.PENDING,
      ).length,
      acknowledged: transfers.filter(
        (transfer) => transfer.status === ParcelInternalTransferStatus.ACKNOWLEDGED,
      ).length,
      cancelled: transfers.filter(
        (transfer) => transfer.status === ParcelInternalTransferStatus.CANCELLED,
      ).length,
    }),
    [transfers],
  );

  async function runSearch() {
    if (!searchTerm.trim()) {
      toast.error('Enter a parcel search term');
      return;
    }
    await searchParcels({
      page: 1,
      pageSize: 20,
      search: searchTerm.trim(),
      filters: {
        companyId,
        destinationId: branchId,
      },
    });
  }

  function addParcel(parcel: ParcelSearchRow) {
    setSelectedParcels((current) =>
      current.some((item) => item.id === parcel.id) ? current : [...current, parcel],
    );
  }

  function removeParcel(parcelId: string) {
    setSelectedParcels((current) => current.filter((parcel) => parcel.id !== parcelId));
  }

  async function handleCreateTransfer() {
    if (!branchId) {
      toast.error('Branch context is required');
      return;
    }
    if (selectedParcels.length === 0) {
      toast.error('Select at least one parcel');
      return;
    }

    try {
      await createTransfer({
        branchId,
        sourceHolderType: Number(sourceHolderType),
        sourceLocationId:
          Number(sourceHolderType) === ParcelHolderType.LOCATION ? sourceLocationId || null : null,
        sourceWarehouseId:
          Number(sourceHolderType) === ParcelHolderType.WAREHOUSE
            ? sourceWarehouseId || null
            : null,
        destinationHolderType: Number(destinationHolderType),
        destinationLocationId:
          Number(destinationHolderType) === ParcelHolderType.LOCATION
            ? destinationLocationId || null
            : null,
        destinationWarehouseId:
          Number(destinationHolderType) === ParcelHolderType.WAREHOUSE
            ? destinationWarehouseId || null
            : null,
        notes: notes.trim() || null,
        parcelIds: selectedParcels.map((parcel) => parcel.id),
      }).unwrap();

      toast.success('Internal transfer created');
      setSelectedParcels([]);
      setNotes('');
      setSearchTerm('');
      await refetchTransfers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create internal transfer');
    }
  }

  async function handleCancelTransfer() {
    if (!cancelTransferId || !cancelReason.trim()) {
      toast.error('Provide a cancel reason');
      return;
    }
    try {
      await cancelTransfer({ id: cancelTransferId, cancelReason: cancelReason.trim() }).unwrap();
      toast.success('Transfer cancelled');
      setCancelTransferId('');
      setCancelReason('');
      await refetchTransfers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to cancel transfer');
    }
  }

  const searchColumns = useMemo<ColumnDef<ParcelSearchRow>[]>(
    () => [
      { accessorKey: 'trackingCode', header: 'Tracking' },
      { accessorKey: 'bookingCode', header: 'Booking' },
      { accessorKey: 'receiverName', header: 'Receiver' },
      { accessorKey: 'parcelDetails', header: 'Parcel' },
      {
        id: 'holder',
        header: 'Current Holder',
        cell: ({ row }) => <ParcelInternalHolderBadge holder={row.original} />,
      },
      {
        id: 'action',
        header: 'Action',
        cell: ({ row }) => (
          <Button
            size="sm"
            variant="outline"
            onClick={() => addParcel(row.original)}
            disabled={selectedParcelIds.has(row.original.id)}
          >
            {selectedParcelIds.has(row.original.id) ? 'Selected' : 'Add'}
          </Button>
        ),
      },
    ],
    [selectedParcelIds],
  );

  const transferColumns = useMemo<ColumnDef<ParcelInternalTransferRow>[]>(
    () => [
      { accessorKey: 'referenceNo', header: 'Reference' },
      {
        id: 'source',
        header: 'From',
        accessorFn: (row) => holderSummary(row, 'source'),
      },
      {
        id: 'destination',
        header: 'To',
        accessorFn: (row) => holderSummary(row, 'destination'),
      },
      {
        id: 'status',
        header: 'Status',
        accessorFn: (row) => transferStatusLabel(row.status),
      },
      { accessorKey: 'itemCount', header: 'Parcels' },
      { accessorKey: 'transferredByName', header: 'Transferred By' },
      { accessorKey: 'transferredAt', header: 'Transferred At' },
      {
        id: 'action',
        header: 'Action',
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSelectedHistoryTransferId(row.original.id)}
            >
              View
            </Button>
            {canCancel && row.original.status === ParcelInternalTransferStatus.PENDING ? (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => setCancelTransferId(row.original.id)}
              >
                Cancel
              </Button>
            ) : null}
          </div>
        ),
      },
    ],
    [canCancel],
  );

  if (!canRead) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Internal Transfers Restricted</CardTitle>
          <CardDescription>
            Your role does not include permission to view parcel internal transfers.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Parcel Internal Transfers</h1>
        <p className="text-sm text-muted-foreground">
          Distribute parcels between the main branch, branch warehouses, and branch locations
          without changing parcel shipment status.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Pending Transfers</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{transferCounts.pending}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Acknowledged Transfers</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{transferCounts.acknowledged}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Cancelled Transfers</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{transferCounts.cancelled}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[430px_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Create Transfer</CardTitle>
            <CardDescription>
              Choose the current holder and the next holder, then select parcels for the move.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label>From</Label>
                <Select
                  value={sourceHolderType}
                  onValueChange={setSourceHolderType}
                  disabled={!canCreate}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={String(ParcelHolderType.BRANCH)}>Main Branch</SelectItem>
                    <SelectItem value={String(ParcelHolderType.LOCATION)}>Location</SelectItem>
                    <SelectItem value={String(ParcelHolderType.WAREHOUSE)}>Warehouse</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {Number(sourceHolderType) === ParcelHolderType.LOCATION ? (
                <div className="space-y-2">
                  <Label>Source Location</Label>
                  <Select
                    value={sourceLocationId || undefined}
                    onValueChange={setSourceLocationId}
                    disabled={!canCreate}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select source location" />
                    </SelectTrigger>
                    <SelectContent>
                      {locationOptions.map((location) => (
                        <SelectItem key={location.id} value={location.id}>
                          {location.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}
              {Number(sourceHolderType) === ParcelHolderType.WAREHOUSE ? (
                <div className="space-y-2">
                  <Label>Source Warehouse</Label>
                  <Select
                    value={sourceWarehouseId || undefined}
                    onValueChange={setSourceWarehouseId}
                    disabled={!canCreate}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select source warehouse" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouseOptions.map((warehouse) => (
                        <SelectItem key={warehouse.id} value={warehouse.id}>
                          {warehouse.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}

              <div className="space-y-2">
                <Label>To</Label>
                <Select
                  value={destinationHolderType}
                  onValueChange={setDestinationHolderType}
                  disabled={!canCreate}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={String(ParcelHolderType.BRANCH)}>Main Branch</SelectItem>
                    <SelectItem value={String(ParcelHolderType.LOCATION)}>Location</SelectItem>
                    <SelectItem value={String(ParcelHolderType.WAREHOUSE)}>Warehouse</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {Number(destinationHolderType) === ParcelHolderType.LOCATION ? (
                <div className="space-y-2">
                  <Label>Destination Location</Label>
                  <Select
                    value={destinationLocationId || undefined}
                    onValueChange={setDestinationLocationId}
                    disabled={!canCreate}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select destination location" />
                    </SelectTrigger>
                    <SelectContent>
                      {locationOptions.map((location) => (
                        <SelectItem key={location.id} value={location.id}>
                          {location.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}
              {Number(destinationHolderType) === ParcelHolderType.WAREHOUSE ? (
                <div className="space-y-2">
                  <Label>Destination Warehouse</Label>
                  <Select
                    value={destinationWarehouseId || undefined}
                    onValueChange={setDestinationWarehouseId}
                    disabled={!canCreate}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select destination warehouse" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouseOptions.map((warehouse) => (
                        <SelectItem key={warehouse.id} value={warehouse.id}>
                          {warehouse.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}
              <div className="space-y-2">
                <Label htmlFor="transfer-notes">Notes</Label>
                <Input
                  id="transfer-notes"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Optional transfer note"
                  disabled={!canCreate}
                />
              </div>
            </div>
            {canCreate ? (
              <Button onClick={() => void handleCreateTransfer()} disabled={isCreating}>
                {isCreating ? 'Creating...' : `Create Transfer (${selectedParcels.length})`}
              </Button>
            ) : null}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Search Parcels</CardTitle>
              <CardDescription>
                Search parcels already assigned to this branch, then add them to the transfer list.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Tracking code, booking code, receiver name, or phone"
                />
                <Button onClick={() => void runSearch()} disabled={isSearching}>
                  Search
                </Button>
              </div>
              <DataTable
                mode="client"
                data={searchResults?.data ?? []}
                columns={searchColumns}
                loading={isSearching}
                pageSizeOptions={[10, 20]}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Selected Parcels</CardTitle>
              <CardDescription>
                These parcels will move together on the same internal transfer note.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {selectedParcels.length === 0 ? (
                <p className="text-sm text-muted-foreground">No parcels selected yet.</p>
              ) : (
                selectedParcels.map((parcel) => (
                  <div
                    key={parcel.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="space-y-1">
                      <p className="font-medium">{parcel.trackingCode}</p>
                      <p className="text-sm text-muted-foreground">
                        {parcel.bookingCode} • {parcel.receiverName || '-'} • {parcel.parcelDetails}
                      </p>
                      <ParcelInternalHolderBadge holder={parcel} />
                    </div>
                    <Button size="sm" variant="outline" onClick={() => removeParcel(parcel.id)}>
                      Remove
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transfer History</CardTitle>
          <CardDescription>Review recent internal moves for this branch.</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            mode="client"
            data={transfers}
            columns={transferColumns}
            loading={isFetchingTransfers}
            showSearch
            searchPlaceholder="Search transfers"
            pageSizeOptions={[10, 20, 50]}
          />
          {cancelTransferId ? (
            <div className="mt-4 space-y-2 rounded-lg border p-4">
              <Label htmlFor="cancel-reason">Cancel Reason</Label>
              <Input
                id="cancel-reason"
                value={cancelReason}
                onChange={(event) => setCancelReason(event.target.value)}
                placeholder="Why is this transfer being cancelled?"
              />
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  onClick={() => void handleCancelTransfer()}
                  disabled={isCancelling}
                >
                  {isCancelling ? 'Cancelling...' : 'Confirm Cancel'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setCancelTransferId('');
                    setCancelReason('');
                  }}
                >
                  Close
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {selectedHistoryTransferId ? (
        <Card>
          <CardHeader>
            <CardTitle>Transfer Slip Preview</CardTitle>
            <CardDescription>
              Review the transfer note and print a handover slip for parcel movement.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isFetchingHistoryDetails ? (
              <p className="text-sm text-muted-foreground">Loading transfer details...</p>
            ) : !selectedHistoryDetails ? (
              <p className="text-sm text-muted-foreground">Transfer details are unavailable.</p>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">
                    {transferStatusLabel(selectedHistoryDetails.transfer.status)}
                  </Badge>
                  <Badge variant="secondary">
                    {selectedHistoryDetails.items.length} parcel
                    {selectedHistoryDetails.items.length === 1 ? '' : 's'}
                  </Badge>
                </div>
                <div className="grid gap-2 text-sm md:grid-cols-2">
                  <p>
                    <strong>Reference:</strong> {selectedHistoryDetails.transfer.referenceNo ?? '-'}
                  </p>
                  <p>
                    <strong>Transferred At:</strong>{' '}
                    {selectedHistoryDetails.transfer.transferredAt ?? '-'}
                  </p>
                  <p>
                    <strong>From:</strong>{' '}
                    {holderSummary(selectedHistoryDetails.transfer, 'source')}
                  </p>
                  <p>
                    <strong>To:</strong>{' '}
                    {holderSummary(selectedHistoryDetails.transfer, 'destination')}
                  </p>
                  <p>
                    <strong>Transferred By:</strong>{' '}
                    {selectedHistoryDetails.transfer.transferredByName ?? '-'}
                  </p>
                  <p>
                    <strong>Notes:</strong> {selectedHistoryDetails.transfer.notes ?? '-'}
                  </p>
                </div>
                <div className="space-y-3">
                  {selectedHistoryDetails.items.map((item) => (
                    <div key={item.parcelId} className="rounded-lg border p-3 text-sm">
                      <p className="font-medium">{item.trackingCode}</p>
                      <p className="text-muted-foreground">
                        {item.bookingCode} • {item.receiverName ?? '-'} • {item.parcelDetails}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    onClick={() => printParcelInternalTransferSlip(selectedHistoryDetails)}
                  >
                    Print Transfer Slip
                  </Button>
                  <Button variant="ghost" onClick={() => setSelectedHistoryTransferId('')}>
                    Close Preview
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
