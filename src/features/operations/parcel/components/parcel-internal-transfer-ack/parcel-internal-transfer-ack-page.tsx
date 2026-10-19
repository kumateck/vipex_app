import { getErrorMessage as getApplicationErrorMessage } from '@/lib/TheAduseiErrorResponse';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { DataTable } from '@/components/datatable';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-searchable';
import { useListWarehouseOptionsQuery } from '@/features/warehouses';
import { ParcelInternalTransferStatus } from '@/db/schemas/enums';
import { PermissionKeys } from '@/shared/permissions/constants';
import { useAuthStore } from '@/stores/auth-store';
import {
  useAcknowledgeParcelInternalTransferMutation,
  useGetParcelInternalTransferDetailsQuery,
  useListParcelInternalTransfersQuery,
} from '../../api/parcel.api';
import { ParcelInternalTransferDetailsCard } from './parcel-internal-transfer-details-card';
import { useParcelInternalTransferColumns } from './use-parcel-internal-transfer-columns';

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

  const handleSelectTransfer = useCallback((transferId: string) => {
    setSelectedTransferId(transferId);
  }, []);

  const columns = useParcelInternalTransferColumns({ onSelectTransfer: handleSelectTransfer });

  const handleAcknowledge = useCallback(async () => {
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
      toast.error(getApplicationErrorMessage(error, '') || 'Failed to acknowledge transfer');
    }
  }, [acknowledgeTransfer, refetch, selectedTransferId]);

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

      <ScrollableWrapper>
        <div className="space-y-6">
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

            <ParcelInternalTransferDetailsCard
              details={details}
              selectedTransferId={selectedTransferId}
              isFetchingDetails={isFetchingDetails}
              canAcknowledge={canAcknowledge}
              isAcknowledging={isAcknowledging}
              onAcknowledge={() => void handleAcknowledge()}
            />
          </div>
        </div>
      </ScrollableWrapper>
    </div>
  );
}
