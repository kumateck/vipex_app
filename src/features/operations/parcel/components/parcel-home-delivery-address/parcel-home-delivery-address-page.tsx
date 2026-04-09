import { useEffect, useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';
import { EllipsisVertical } from 'lucide-react';
import { DataTable } from '@/components/datatable';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { ParcelStatus } from '@/db/schemas/enums';
import type { PaginationMeta } from '@/server/types/pagination.types';
import type { ServerListQuery } from '@/services/rtk-query';
import { useAuthStore } from '@/stores/auth-store';
import {
  type ParcelSearchRow,
  useCollectDoorstepAddressMutation,
  useSearchParcelsQuery,
  useUpdateParcelMutation,
} from '../../api/parcel.api';
import { ParcelHomeDeliveryAddressDialog } from './parcel-home-delivery-address-dialog';

const EMPTY_META: PaginationMeta = {
  totalRecords: 0,
  totalPages: 1,
  page: 1,
  pageSize: 20,
  hasNextPage: false,
  hasPreviousPage: false,
};

const formatCurrency = (amountPsw: number) => `GHS ${(amountPsw / 100).toFixed(2)}`;

export function ParcelHomeDeliveryAddressPage() {
  const user = useAuthStore((state) => state.user);
  const companyId = user?.company?.id ?? null;
  const branchId = user?.branch?.id ?? null;
  const userId = user?.id ?? '';
  const [searchInput, setSearchInput] = useState('');
  const [query, setQuery] = useState<
    ServerListQuery<{
      companyId?: string | null;
      destinationId?: string | null;
      status?: number | null;
    }>
  >({
    page: 1,
    pageSize: 20,
    filters: { companyId, destinationId: branchId, status: ParcelStatus.HOME_DELIVERY_REQUESTED },
  });
  const [selectedParcel, setSelectedParcel] = useState<ParcelSearchRow | null>(null);
  const [dropoffAddress, setDropoffAddress] = useState('');
  const [deliveryFee, setDeliveryFee] = useState('');
  const [collectAddress, { isLoading: isSaving }] = useCollectDoorstepAddressMutation();
  const [updateParcel, { isLoading: isReturningToPickup }] = useUpdateParcelMutation();
  const listQuery = useSearchParcelsQuery(query, { skip: !companyId || !branchId });

  useEffect(() => {
    setQuery((prev) => ({
      ...prev,
      page: 1,
      filters: { companyId, destinationId: branchId, status: ParcelStatus.HOME_DELIVERY_REQUESTED },
    }));
  }, [companyId, branchId]);

  const columns = useMemo<ColumnDef<ParcelSearchRow>[]>(
    () => [
      { accessorKey: 'trackingCode', header: 'Tracking' },
      { accessorKey: 'bookingCode', header: 'Booking' },
      { accessorKey: 'parcelDetails', header: 'Parcel Details' },
      {
        id: 'receiver',
        header: 'Receiver',
        accessorFn: (row) =>
          `${row.receiverName ?? '-'}${row.receiverPhone ? ` (${row.receiverPhone})` : ''}`,
      },
      {
        id: 'toBePaid',
        header: 'To Be Paid',
        accessorFn: (row) => formatCurrency(row.plannedToBePaidPsw),
      },
      {
        id: 'action',
        header: 'Action',
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon"
                variant="outline"
                className="h-8 w-8"
                disabled={isReturningToPickup}
              >
                <EllipsisVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  setSelectedParcel(row.original);
                  setDropoffAddress('');
                  setDeliveryFee('');
                }}
              >
                Collect Address
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={async () => {
                  try {
                    await updateParcel({
                      id: row.original.id,
                      status: ParcelStatus.AWAITING_PICKUP,
                    }).unwrap();
                    toast.success('Parcel moved to Awaiting Pickup');
                    await listQuery.refetch();
                  } catch (error) {
                    toast.error(
                      error instanceof Error ? error.message : 'Failed to move parcel to pickup',
                    );
                  }
                }}
              >
                Return to Pickup
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [isReturningToPickup, listQuery, updateParcel],
  );

  const onSubmit = async () => {
    if (!selectedParcel) return;
    try {
      await collectAddress({
        parcelId: selectedParcel.id,
        userId,
        dropoffAddress: dropoffAddress.trim(),
        deliveryFeeCedis: deliveryFee,
      }).unwrap();
      toast.success('Address and delivery fee saved');
      setSelectedParcel(null);
      await listQuery.refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save');
    }
  };

  return (
    <div className="w-full p-4 space-y-4">
      <ScrollableWrapper>
        <Card>
          <CardHeader>
            <CardTitle>Home Delivery Address Collection</CardTitle>
            <CardDescription>
              Call receiver, collect home address and delivery fee, then move to address collected.
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
              <Input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search by tracking, booking, receiver"
              />
              <Button type="submit">Search</Button>
            </form>
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
                status: ParcelStatus.HOME_DELIVERY_REQUESTED,
              }}
              onRequestChange={(next) =>
                setQuery((prev) => ({
                  ...prev,
                  ...next,
                  search: prev.search,
                  filters: {
                    companyId,
                    destinationId: branchId,
                    status: ParcelStatus.HOME_DELIVERY_REQUESTED,
                  },
                }))
              }
              enableVirtualization={false}
            />
          </CardContent>
        </Card>
      </ScrollableWrapper>

      <ParcelHomeDeliveryAddressDialog
        parcel={selectedParcel}
        dropoffAddress={dropoffAddress}
        onDropoffAddressChange={setDropoffAddress}
        deliveryFee={deliveryFee}
        onDeliveryFeeChange={setDeliveryFee}
        isSaving={isSaving}
        onClose={() => setSelectedParcel(null)}
        onSubmit={onSubmit}
      />
    </div>
  );
}
