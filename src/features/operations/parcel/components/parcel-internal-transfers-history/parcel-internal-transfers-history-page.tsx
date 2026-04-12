import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { DataTable } from '@/components/datatable';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { ParcelInternalTransferStatus } from '@/db/schemas/enums';
import { PermissionKeys } from '@/shared/permissions/constants';
import { useAuthStore } from '@/stores/auth-store';
import {
  useCancelParcelInternalTransferMutation,
  useGetParcelInternalTransferDetailsQuery,
  useListParcelInternalTransfersQuery,
} from '../../api/parcel.api';
import { ParcelInternalTransfersHistoryPreviewCard } from './parcel-internal-transfers-history-preview-card';
import { useParcelInternalTransfersHistoryColumns } from './use-parcel-internal-transfers-history-columns';

export function ParcelInternalTransfersHistoryPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const branchId = user?.branch?.id ?? '';
  const canRead = user?.permissions?.includes(PermissionKeys.CanReadParcelInternalTransfers);
  const canCancel = user?.permissions?.includes(PermissionKeys.CanCancelParcelInternalTransfers);

  const [cancelReason, setCancelReason] = useState('');
  const [cancelTransferId, setCancelTransferId] = useState('');
  const [selectedTransferId, setSelectedTransferId] = useState('');

  const {
    data: transfers = [],
    refetch,
    isFetching,
  } = useListParcelInternalTransfersQuery({ branchId }, { skip: !branchId || !canRead });
  const { data: selectedTransferDetails, isFetching: isFetchingDetails } =
    useGetParcelInternalTransferDetailsQuery(selectedTransferId, {
      skip: !selectedTransferId,
    });
  const [cancelTransfer, { isLoading: isCancelling }] = useCancelParcelInternalTransferMutation();

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

  const columns = useParcelInternalTransfersHistoryColumns({
    canCancel: Boolean(canCancel),
    onViewTransfer: setSelectedTransferId,
    onCancelTransfer: setCancelTransferId,
  });

  const handleCancelTransfer = useCallback(async () => {
    if (!cancelTransferId || !cancelReason.trim()) {
      toast.error('Provide a cancel reason');
      return;
    }

    try {
      await cancelTransfer({ id: cancelTransferId, cancelReason: cancelReason.trim() }).unwrap();
      toast.success('Transfer cancelled');
      setCancelTransferId('');
      setCancelReason('');
      await refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to cancel transfer');
    }
  }, [cancelReason, cancelTransfer, cancelTransferId, refetch]);

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
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Parcel Internal Transfer History
          </h1>
          <p className="text-sm text-muted-foreground">
            Review transfer notes, statuses, and print handover slips.
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate('/parcels/internal-transfers')}>
          Create Transfer
        </Button>
      </div>

      <ScrollableWrapper>
        <div className="space-y-6">
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

          <Card>
            <CardHeader>
              <CardTitle>Transfer History</CardTitle>
              <CardDescription>Review recent internal moves for this branch.</CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                mode="client"
                data={transfers}
                columns={columns}
                loading={isFetching}
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

          <ParcelInternalTransfersHistoryPreviewCard
            selectedTransferId={selectedTransferId}
            details={selectedTransferDetails}
            isFetchingDetails={isFetchingDetails}
            onClosePreview={() => setSelectedTransferId('')}
          />
        </div>
      </ScrollableWrapper>
    </div>
  );
}
