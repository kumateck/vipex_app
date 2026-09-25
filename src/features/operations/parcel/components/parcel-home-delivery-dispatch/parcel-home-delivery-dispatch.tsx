import { getErrorMessage as getApplicationErrorMessage } from '@/lib/TheAduseiErrorResponse';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { DataTable } from '@/components/datatable';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-searchable';
import { useListUserOptionsQuery } from '@/features/users/api/users.api';
import { ParcelStatus } from '@/db/schemas/enums';
import type { PaginationMeta } from '@/server/types/pagination.types';
import type { ServerListQuery } from '@/services/rtk-query';
import { useAuthStore } from '@/stores/auth-store';
import {
  type ParcelSearchRow,
  type HomeDeliveryReceipt,
  useDispatchDoorstepParcelsMutation,
  useLazyGetHomeDeliveryReceiptQuery,
  useSearchParcelsQuery,
  useUpdateParcelMutation,
} from '../../api/parcel.api';
import { useHomeDeliveryDispatchColumns } from './use-home-delivery-dispatch-columns';
import { HomeDeliveryReceiptPrintController } from './home-delivery-receipt-print-controller';

const EMPTY_META: PaginationMeta = {
  totalRecords: 0,
  totalPages: 1,
  page: 1,
  pageSize: 20,
  hasNextPage: false,
  hasPreviousPage: false,
};

export function ParcelHomeDeliveryDispatch() {
  const user = useAuthStore((state) => state.user);
  const companyId = user?.company?.id ?? null;
  const branchId = user?.branch?.id ?? null;
  const userId = user?.id ?? '';
  const [searchInput, setSearchInput] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [riderUserId, setRiderUserId] = useState('');
  const [printData, setPrintData] = useState<HomeDeliveryReceipt | null>(null);
  const [query, setQuery] = useState<
    ServerListQuery<{
      companyId?: string | null;
      destinationId?: string | null;
      statuses?: number[] | null;
    }>
  >({
    page: 1,
    pageSize: 20,
    filters: {
      companyId,
      destinationId: branchId,
      statuses: [ParcelStatus.ADDRESS_COLLECTED, ParcelStatus.RETURNED_TO_OFFICE],
    },
  });
  const listQuery = useSearchParcelsQuery(query, { skip: !companyId || !branchId });
  const [dispatchBulk, { isLoading: isDispatching }] = useDispatchDoorstepParcelsMutation();
  const [updateParcel, { isLoading: isReturningToPickup }] = useUpdateParcelMutation();
  const [loadReceipt, { isFetching: isLoadingReceipt }] = useLazyGetHomeDeliveryReceiptQuery();

  const { data: riderOptions = [] } = useListUserOptionsQuery(
    companyId && branchId ? { companyId, branchId, userType: 2 } : undefined,
    { skip: !companyId || !branchId },
  );

  useEffect(() => {
    setQuery((prev) => ({
      ...prev,
      page: 1,
      filters: {
        companyId,
        destinationId: branchId,
        statuses: [ParcelStatus.ADDRESS_COLLECTED, ParcelStatus.RETURNED_TO_OFFICE],
      },
    }));
  }, [companyId, branchId]);

  const onReturnToPickup = useCallback(
    async (parcel: ParcelSearchRow) => {
      try {
        await updateParcel({ id: parcel.id, status: ParcelStatus.AWAITING_PICKUP }).unwrap();
        toast.success('Parcel moved to Awaiting Pickup');
        setSelectedIds((prev) => prev.filter((id) => id !== parcel.id));
        await listQuery.refetch();
      } catch (error) {
        toast.error(getApplicationErrorMessage(error, '') || 'Failed to move parcel to pickup');
      }
    },
    [updateParcel, listQuery],
  );

  const onPrint = useCallback(
    async (parcel: ParcelSearchRow) => {
      try {
        const receipt = await loadReceipt(parcel.id).unwrap();
        setPrintData(receipt);
      } catch (error) {
        toast.error(
          getApplicationErrorMessage(error, '') || 'Failed to load home delivery receipt',
        );
      }
    },
    [loadReceipt],
  );

  const columns = useHomeDeliveryDispatchColumns({
    selectedIds,
    setSelectedIds,
    isReturningToPickup,
    isPrinting: isLoadingReceipt || printData !== null,
    onReturnToPickup,
    onPrint,
  });

  const onDispatch = async () => {
    if (!riderUserId) {
      toast.error('Select rider');
      return;
    }
    if (!selectedIds.length) {
      toast.error('Select parcels to dispatch');
      return;
    }
    try {
      const result = await dispatchBulk({
        parcelIds: selectedIds,
        riderUserId,
        userId,
      }).unwrap();
      toast.success(`Dispatched ${result.updated} parcel(s)`);
      setSelectedIds([]);
      await listQuery.refetch();
    } catch (error) {
      toast.error(getApplicationErrorMessage(error, '') || 'Failed to dispatch');
    }
  };

  return (
    <div className="w-full p-4 space-y-4">
      <ScrollableWrapper>
        <Card>
          <CardHeader>
            <CardTitle>Home Delivery Dispatch</CardTitle>
            <CardDescription>
              Load address-collected and returned parcels, then dispatch/reassign to rider by area.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form
              className="flex items-center gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                const term = searchInput.trim();
                setQuery((prev) => ({ ...prev, page: 1, search: term.length ? term : undefined }));
              }}
            >
              <input
                className="h-10 rounded-md border px-3 w-full"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search by tracking, booking, receiver or area"
              />
              <Button type="submit">Search</Button>
            </form>

            <div className="flex flex-wrap items-center gap-2">
              <Select value={riderUserId} onValueChange={setRiderUserId}>
                <SelectTrigger className="w-72">
                  <SelectValue placeholder="Select rider" />
                </SelectTrigger>
                <SelectContent>
                  {riderOptions.map((rider) => (
                    <SelectItem key={rider.id} value={rider.id}>
                      {rider.fullname}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={onDispatch} disabled={isDispatching}>
                {isDispatching ? 'Dispatching...' : `Dispatch Selected (${selectedIds.length})`}
              </Button>
            </div>

            <DataTable
              mode="server"
              data={listQuery.data?.data ?? []}
              columns={columns}
              meta={listQuery.data?.meta ?? EMPTY_META}
              loading={listQuery.isLoading}
              showSearch={false}
              serverFilters={{
                companyId,
                destinationId: branchId,
                statuses: [ParcelStatus.ADDRESS_COLLECTED, ParcelStatus.RETURNED_TO_OFFICE],
              }}
              onRequestChange={(next) =>
                setQuery((prev) => ({
                  ...prev,
                  ...next,
                  search: prev.search,
                  filters: {
                    companyId,
                    destinationId: branchId,
                    statuses: [ParcelStatus.ADDRESS_COLLECTED, ParcelStatus.RETURNED_TO_OFFICE],
                  },
                }))
              }
              enableVirtualization={false}
            />
          </CardContent>
        </Card>
      </ScrollableWrapper>
      {printData ? (
        <HomeDeliveryReceiptPrintController
          key={printData.trackingCode}
          receipt={printData}
          onComplete={() => setPrintData(null)}
        />
      ) : null}
    </div>
  );
}
