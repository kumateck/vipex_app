import { useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';
import { DataTable } from '@/components/datatable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useListWarehouseOptionsQuery } from '@/features/warehouses';
import { ParcelHolderType, ParcelInternalTransferStatus } from '@/db/schemas/enums';
import { PermissionKeys } from '@/shared/permissions/constants';
import { useAuthStore } from '@/stores/auth-store';
import {
  type ParcelInternalTransferRow,
  useAcknowledgeParcelInternalTransferMutation,
  useGetParcelInternalTransferDetailsQuery,
  useListParcelInternalTransfersQuery,
} from '../api/parcel.api';
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

export function ParcelInternalTransferAcknowledgePage() {
  const user = useAuthStore((state) => state.user);
  const companyId = user?.company?.id ?? '';
  const branchId = user?.branch?.id ?? '';
  const defaultLocationId = user?.location?.id ?? '';
  const canRead = user?.permissions?.includes(PermissionKeys.CanReadParcelInternalTransfers);
  const canAcknowledge = user?.permissions?.includes(
    PermissionKeys.CanAcknowledgeParcelInternalTransfers,
  );

  const [warehouseFilter, setWarehouseFilter] = useState('');
  const [selectedTransferId, setSelectedTransferId] = useState('');

  const { data: warehouseOptions = [] } = useListWarehouseOptionsQuery(
    { companyId, branchId, activeOnly: true },
    { skip: !companyId || !branchId },
  );

  const queryArgs = useMemo(
    () => ({
      branchId,
      status: ParcelInternalTransferStatus.PENDING,
      destinationLocationId: defaultLocationId || undefined,
      destinationWarehouseId: !defaultLocationId && warehouseFilter ? warehouseFilter : undefined,
    }),
    [branchId, defaultLocationId, warehouseFilter],
  );

  const {
    data: transfers = [],
    isFetching,
    refetch,
  } = useListParcelInternalTransfersQuery(queryArgs, {
    skip: !branchId || !canRead,
  });
  const { data: details, isFetching: isFetchingDetails } = useGetParcelInternalTransferDetailsQuery(
    selectedTransferId,
    { skip: !selectedTransferId },
  );
  const [acknowledgeTransfer, { isLoading: isAcknowledging }] =
    useAcknowledgeParcelInternalTransferMutation();
  const pendingParcelCount = useMemo(
    () => transfers.reduce((sum, transfer) => sum + transfer.itemCount, 0),
    [transfers],
  );

  async function handleAcknowledge() {
    if (!selectedTransferId) {
      toast.error('Select a transfer first');
      return;
    }
    try {
      await acknowledgeTransfer({ id: selectedTransferId }).unwrap();
      toast.success('Transfer acknowledged');
      setSelectedTransferId('');
      await refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to acknowledge transfer');
    }
  }

  const columns = useMemo<ColumnDef<ParcelInternalTransferRow>[]>(
    () => [
      { accessorKey: 'referenceNo', header: 'Reference' },
      {
        id: 'from',
        header: 'From',
        accessorFn: (row) =>
          row.sourceLocationName ??
          row.sourceWarehouseName ??
          holderTypeLabel(row.sourceHolderType),
      },
      {
        id: 'to',
        header: 'To',
        accessorFn: (row) =>
          row.destinationLocationName ??
          row.destinationWarehouseName ??
          holderTypeLabel(row.destinationHolderType),
      },
      { accessorKey: 'itemCount', header: 'Parcels' },
      { accessorKey: 'transferredByName', header: 'Transferred By' },
      { accessorKey: 'transferredAt', header: 'Transferred At' },
      {
        id: 'select',
        header: 'Action',
        cell: ({ row }) => (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setSelectedTransferId(row.original.id)}
          >
            View
          </Button>
        ),
      },
    ],
    [],
  );

  if (!canRead) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Acknowledgement Restricted</CardTitle>
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
        <h1 className="text-2xl font-semibold tracking-tight">Acknowledge Internal Transfers</h1>
        <p className="text-sm text-muted-foreground">
          Confirm when parcel batches physically reach this location, warehouse, or main branch.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Pending Transfer Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{transfers.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Pending Parcels To Receive</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{pendingParcelCount}</p>
          </CardContent>
        </Card>
      </div>

      {!defaultLocationId ? (
        <Card>
          <CardHeader>
            <CardTitle>Warehouse Filter</CardTitle>
            <CardDescription>
              Optional filter for branch teams acknowledging transfers into a warehouse.
            </CardDescription>
          </CardHeader>
          <CardContent className="max-w-sm">
            <div className="space-y-2">
              <Label>Destination Warehouse</Label>
              <Select
                value={warehouseFilter || 'all'}
                onValueChange={(value) => setWarehouseFilter(value === 'all' ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All pending branch transfers</SelectItem>
                  {warehouseOptions.map((warehouse) => (
                    <SelectItem key={warehouse.id} value={warehouse.id}>
                      {warehouse.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Card>
          <CardHeader>
            <CardTitle>Pending Transfers</CardTitle>
            <CardDescription>
              Only transfers still waiting for acknowledgement appear here.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              mode="client"
              data={transfers}
              columns={columns}
              loading={isFetching}
              showSearch
              searchPlaceholder="Search pending transfers"
              pageSizeOptions={[10, 20, 50]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Transfer Details</CardTitle>
            <CardDescription>Review the parcel list before acknowledging receipt.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!selectedTransferId ? (
              <p className="text-sm text-muted-foreground">
                Select a pending transfer to inspect it.
              </p>
            ) : isFetchingDetails ? (
              <p className="text-sm text-muted-foreground">Loading transfer details...</p>
            ) : !details ? (
              <p className="text-sm text-muted-foreground">Transfer details are unavailable.</p>
            ) : (
              <>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">
                    {details.items.length} parcel{details.items.length === 1 ? '' : 's'}
                  </Badge>
                  <Badge variant="secondary">Pending acknowledgement</Badge>
                </div>
                <div className="space-y-2 text-sm">
                  <p>
                    <strong>Reference:</strong> {details.transfer.referenceNo ?? '-'}
                  </p>
                  <p>
                    <strong>From:</strong>{' '}
                    {details.transfer.sourceLocationName ??
                      details.transfer.sourceWarehouseName ??
                      holderTypeLabel(details.transfer.sourceHolderType)}
                  </p>
                  <p>
                    <strong>To:</strong>{' '}
                    {details.transfer.destinationLocationName ??
                      details.transfer.destinationWarehouseName ??
                      holderTypeLabel(details.transfer.destinationHolderType)}
                  </p>
                  <p>
                    <strong>Transferred By:</strong> {details.transfer.transferredByName ?? '-'}
                  </p>
                  <p>
                    <strong>Notes:</strong> {details.transfer.notes || '-'}
                  </p>
                </div>
                <div className="space-y-3">
                  {details.items.map((item) => (
                    <div key={item.parcelId} className="rounded-lg border p-3 text-sm">
                      <p className="font-medium">{item.trackingCode}</p>
                      <p className="text-muted-foreground">
                        {item.bookingCode} • {item.receiverName || '-'} • {item.parcelDetails}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    onClick={() => printParcelInternalTransferSlip(details)}
                  >
                    Print Transfer Slip
                  </Button>
                  {canAcknowledge ? (
                    <Button onClick={() => void handleAcknowledge()} disabled={isAcknowledging}>
                      {isAcknowledging ? 'Acknowledging...' : 'Acknowledge Receipt'}
                    </Button>
                  ) : null}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
