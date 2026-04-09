import { useEffect, useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';
import { EllipsisVertical } from 'lucide-react';
import { DataTable } from '@/components/datatable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  useDispatchDoorstepParcelsMutation,
  useSearchParcelsQuery,
  useUpdateParcelMutation,
} from '../../api/parcel.api';

const EMPTY_META: PaginationMeta = {
  totalRecords: 0,
  totalPages: 1,
  page: 1,
  pageSize: 20,
  hasNextPage: false,
  hasPreviousPage: false,
};

function formatCurrency(amountPsw: number | null | undefined) {
  return `GHS ${((amountPsw ?? 0) / 100).toFixed(2)}`;
}

export function ParcelHomeDeliveryDispatchPage() {
  const user = useAuthStore((state) => state.user);
  const companyId = user?.company?.id ?? null;
  const branchId = user?.branch?.id ?? null;
  const userId = user?.id ?? '';
  const [searchInput, setSearchInput] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [riderUserId, setRiderUserId] = useState('');
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

  const columns = useMemo<ColumnDef<ParcelSearchRow>[]>(
    () => [
      {
        id: 'select',
        header: 'Select',
        cell: ({ row }) => {
          const checked = selectedIds.includes(row.original.id);
          return (
            <Checkbox
              checked={checked}
              onCheckedChange={(next) =>
                setSelectedIds((prev) =>
                  next ? [...prev, row.original.id] : prev.filter((id) => id !== row.original.id),
                )
              }
            />
          );
        },
      },
      // { accessorKey: 'trackingCode', header: 'Tracking' },
      { accessorKey: 'bookingCode', header: 'Booking' },
      { accessorKey: 'parcelDetails', header: 'Parcel Details' },
      {
        id: 'receiver',
        header: 'Receiver',
        accessorFn: (row) =>
          `${row.receiverName ?? '-'}${row.receiverPhone ? ` (${row.receiverPhone})` : ''}`,
      },
      {
        id: 'statusLabel',
        header: 'Status',
        accessorFn: (row) =>
          row.status === ParcelStatus.ADDRESS_COLLECTED
            ? 'Address Collected'
            : 'Returned To Office',
      },
      {
        id: 'addressCollection',
        header: 'Address',
        cell: ({ row }) =>
          row.original.dropoffAddress ? (
            <div className="space-y-1">
              <Badge variant="secondary">Collected</Badge>
              <p className="max-w-xs text-xs text-muted-foreground">
                {row.original.dropoffAddress}
              </p>
            </div>
          ) : (
            <Badge variant="outline">Pending</Badge>
          ),
      },
      {
        id: 'toBePaid',
        header: 'To Be Paid',
        accessorFn: (row) => formatCurrency(row.plannedToBePaidPsw),
      },
      {
        id: 'deliveryFee',
        header: 'Delivery Fee',
        accessorFn: (row) => formatCurrency(row.deliveryFeePsw),
      },
      {
        id: 'action',
        header: 'Action',
        enableSorting: false,
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
                onClick={async () => {
                  try {
                    await updateParcel({
                      id: row.original.id,
                      status: ParcelStatus.AWAITING_PICKUP,
                    }).unwrap();
                    toast.success('Parcel moved to Awaiting Pickup');
                    setSelectedIds((prev) => prev.filter((id) => id !== row.original.id));
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
    [isReturningToPickup, listQuery, selectedIds, updateParcel],
  );

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
      toast.error(error instanceof Error ? error.message : 'Failed to dispatch');
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
    </div>
  );
}
