import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';
import { DataTable } from '@/components/datatable';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ParcelStatus, PaymentMethod } from '@/db/schemas/enums';
import type { PaginationMeta } from '@/server/types/pagination.types';
import type { ServerListQuery } from '@/services/rtk-query';
import { useAuthStore } from '@/stores/auth-store';
import { useListBranchOptionsQuery } from '@/features/branches/api/branches.api';
import { useUpdateCustomerMutation } from '@/features/customers/api';
import {
  type ParcelSearchRow,
  useGetParcelDetailsQuery,
  useSearchParcelsQuery,
  useUpdateParcelMutation,
  useUpdateParcelStatusMutation,
} from '../api/parcel.api';

type InTransitView = 'outgoing' | 'incoming';

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
  return date.toLocaleString();
}

function formatCurrency(amountPsw: number) {
  return `GHS ${(amountPsw / 100).toFixed(2)}`;
}

function formatConsignmentLabel(serialForDay: number | null | undefined) {
  if (!serialForDay || serialForDay < 1) return '-';
  return `Consignment ${serialForDay}`;
}

function paymentMethodLabel(method: number) {
  const label = PaymentMethod[method];
  return typeof label === 'string' ? label : String(method);
}

export function ParcelInTransitPage({ view }: { view: InTransitView }) {
  const user = useAuthStore((state) => state.user);
  const companyId = user?.company?.id ?? null;
  const branchId = user?.branch?.id ?? null;
  const [searchInput, setSearchInput] = useState('');

  const serverFilters = useMemo(
    () => ({
      companyId: companyId ?? undefined,
      sourceId: view === 'outgoing' ? (branchId ?? undefined) : undefined,
      destinationId: view === 'incoming' ? (branchId ?? undefined) : undefined,
      status: ParcelStatus.IN_TRANSIT,
    }),
    [branchId, companyId, view],
  );

  const [query, setQuery] = useState<
    ServerListQuery<{
      companyId?: string;
      sourceId?: string;
      destinationId?: string;
      status?: number;
    }>
  >({
    page: 1,
    pageSize: 20,
    filters: serverFilters,
  });

  const [selectedParcelId, setSelectedParcelId] = useState<string | null>(null);
  const [editingParcel, setEditingParcel] = useState<ParcelSearchRow | null>(null);
  const [editParcelDetails, setEditParcelDetails] = useState('');
  const [editReceiverName, setEditReceiverName] = useState('');
  const [editReceiverPhone, setEditReceiverPhone] = useState('');
  const [updateParcel, { isLoading: isUpdatingParcel }] = useUpdateParcelMutation();
  const [updateCustomer, { isLoading: isUpdatingCustomer }] = useUpdateCustomerMutation();
  const [updateParcelStatus, { isLoading: isUpdatingStatus }] = useUpdateParcelStatusMutation();

  useEffect(() => {
    setQuery((prev) => ({
      ...prev,
      page: 1,
      filters: serverFilters,
    }));
  }, [serverFilters]);

  const handleSearchSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const term = searchInput.trim();
      setQuery((prev) => ({
        ...prev,
        page: 1,
        search: term.length > 0 ? term : undefined,
        filters: serverFilters,
      }));
    },
    [searchInput, serverFilters],
  );

  const handleRequestChange = useCallback(
    (
      nextRequest: ServerListQuery<{
        companyId?: string;
        sourceId?: string;
        destinationId?: string;
        status?: number;
      }>,
    ) => {
      setQuery((prev) => ({
        ...prev,
        ...nextRequest,
        search: prev.search,
        filters: serverFilters,
      }));
    },
    [serverFilters],
  );

  const handleMarkAsArrived = useCallback(
    async (parcel: ParcelSearchRow) => {
      await updateParcelStatus({
        id: parcel.id,
        status: ParcelStatus.ARRIVED_AT_DESTINATION,
      }).unwrap();
      toast.success(`Received ${parcel.trackingCode}`);
    },
    [updateParcelStatus],
  );

  const { data, isLoading, refetch } = useSearchParcelsQuery(query, {
    skip: !companyId || !branchId,
  });
  const { data: details, isFetching: isDetailsLoading } = useGetParcelDetailsQuery(
    selectedParcelId ?? '',
    {
      skip: !selectedParcelId,
    },
  );

  const { data: branchOptions = [] } = useListBranchOptionsQuery(
    { companyId },
    { skip: !companyId },
  );
  const branchNameById = useMemo(
    () => new Map(branchOptions.map((branch) => [branch.id, branch.name])),
    [branchOptions],
  );

  const columns = useMemo<ColumnDef<ParcelSearchRow>[]>(
    () => [
      { accessorKey: 'trackingCode', header: 'Tracking' },
      { accessorKey: 'bookingCode', header: 'Booking' },
      { accessorKey: 'parcelDetails', header: 'Parcel Details' },
      { accessorKey: 'parcelContent', header: 'Parcel Content' },
      {
        id: 'sender',
        header: 'Sender',
        accessorFn: (row) =>
          `${row.senderName ?? '-'}${row.senderPhone ? ` (${row.senderPhone})` : ''}`,
      },
      {
        id: 'receiver',
        header: 'Receiver',
        accessorFn: (row) =>
          `${row.receiverName ?? '-'}${row.receiverPhone ? ` (${row.receiverPhone})` : ''}`,
      },
      ...(view === 'incoming'
        ? ([
            {
              id: 'source',
              header: 'Source Branch',
              accessorFn: (row: ParcelSearchRow) => branchNameById.get(row.sourceId) ?? '-',
            },
          ] satisfies ColumnDef<ParcelSearchRow>[])
        : ([
            {
              id: 'destination',
              header: 'Destination Branch',
              accessorFn: (row: ParcelSearchRow) => branchNameById.get(row.destinationId) ?? '-',
            },
          ] satisfies ColumnDef<ParcelSearchRow>[])),
      {
        id: 'consignment',
        header: 'Consignment',
        accessorFn: (row) => formatConsignmentLabel(row.consignmentSerialForDay),
      },
      {
        id: 'actions',
        header: 'Actions',
        enableSorting: false,
        cell: ({ row }) => {
          const parcel = row.original;
          return (
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => setSelectedParcelId(parcel.id)}>
                View Details
              </Button>
              {view === 'incoming' ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditingParcel(parcel);
                    setEditParcelDetails(parcel.parcelDetails ?? '');
                    setEditReceiverName(parcel.receiverName ?? '');
                    setEditReceiverPhone(parcel.receiverPhone ?? '');
                  }}
                >
                  Edit
                </Button>
              ) : null}
              {view === 'incoming' ? (
                <Button
                  size="sm"
                  onClick={async () => {
                    try {
                      await handleMarkAsArrived(parcel);
                    } catch (error) {
                      toast.error(
                        error instanceof Error ? error.message : 'Failed to update parcel status',
                      );
                    }
                  }}
                  disabled={isUpdatingStatus}
                >
                  Mark Arrived
                </Button>
              ) : null}
            </div>
          );
        },
      },
    ],
    [branchNameById, handleMarkAsArrived, isUpdatingStatus, view],
  );

  const handleSaveIncomingEdits = useCallback(async () => {
    if (!editingParcel) return;

    const nextParcelDetails = editParcelDetails.trim();
    const nextReceiverName = editReceiverName.trim();
    const nextReceiverPhone = editReceiverPhone.trim();

    if (nextParcelDetails.length === 0) {
      toast.error('Parcel details is required');
      return;
    }
    if (nextReceiverName.length === 0) {
      toast.error('Receiver name is required');
      return;
    }

    const updates: Promise<unknown>[] = [];

    if (nextParcelDetails !== (editingParcel.parcelDetails ?? '').trim()) {
      updates.push(
        updateParcel({
          id: editingParcel.id,
          parcelDetails: nextParcelDetails,
        }).unwrap(),
      );
    }

    if (
      nextReceiverName !== (editingParcel.receiverName ?? '').trim() ||
      nextReceiverPhone !== (editingParcel.receiverPhone ?? '').trim()
    ) {
      updates.push(
        updateCustomer({
          id: editingParcel.receiverId,
          fullname: nextReceiverName,
          telephone: nextReceiverPhone.length > 0 ? nextReceiverPhone : null,
        }).unwrap(),
      );
    }

    if (updates.length === 0) {
      toast.message('No changes to save');
      setEditingParcel(null);
      return;
    }

    await Promise.all(updates);
    toast.success('Incoming parcel updated');
    setEditingParcel(null);
    await refetch();
  }, [
    editParcelDetails,
    editReceiverName,
    editReceiverPhone,
    editingParcel,
    refetch,
    updateCustomer,
    updateParcel,
  ]);

  const title =
    view === 'outgoing' ? 'In Transit (Sending Branch)' : 'In Transit (Receiving Branch)';
  const description =
    view === 'outgoing'
      ? 'Parcels in transit sent from your branch to destination branches.'
      : 'Parcels in transit coming to your branch from source branches.';

  return (
    <div className="w-full p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="flex items-center gap-2" onSubmit={handleSearchSubmit}>
            <Input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search by tracking, booking, sender or receiver"
              className="h-11 text-base"
            />
            <Button type="submit" className="h-11 px-6" disabled={!companyId || !branchId}>
              Search
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-11 px-6"
              onClick={() => {
                setSearchInput('');
                setQuery((prev) => ({
                  ...prev,
                  page: 1,
                  search: undefined,
                  filters: serverFilters,
                }));
              }}
            >
              Clear
            </Button>
          </form>
          <DataTable
            mode="server"
            data={data?.data ?? []}
            columns={columns}
            meta={data?.meta ?? EMPTY_META}
            loading={isLoading}
            showSearch={false}
            serverFilters={serverFilters}
            onRequestChange={handleRequestChange}
            enableVirtualization={false}
          />
        </CardContent>
      </Card>

      <Dialog
        open={Boolean(selectedParcelId)}
        onOpenChange={(open) => (!open ? setSelectedParcelId(null) : null)}
      >
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Parcel Details</DialogTitle>
          </DialogHeader>

          {!details || isDetailsLoading ? (
            <div className="py-8 text-center text-muted-foreground">Loading details...</div>
          ) : (
            (() => {
              const activeConsignment =
                details.consignments.find((consignment) => !consignment.removedAt) ??
                details.consignments[0];
              const totalPaidPsw = details.payments.reduce(
                (sum, payment) => sum + payment.grossAmountPsw,
                0,
              );
              const paymentMethods = Array.from(
                new Set(details.payments.map((payment) => paymentMethodLabel(payment.method))),
              );
              const hasPaid = totalPaidPsw > 0;

              return (
                <div className="space-y-2 text-sm">
                  <p>
                    <strong>Tracking:</strong> {details.parcel.trackingCode}
                  </p>
                  <p>
                    <strong>Booking:</strong> {details.parcel.bookingCode}
                  </p>
                  <p>
                    <strong>Parcel Details:</strong> {details.parcel.parcelDetails || '-'}
                  </p>
                  <p>
                    <strong>Parcel Content:</strong> {details.parcel.parcelContent || '-'}
                  </p>
                  <p>
                    <strong>Source:</strong> {branchNameById.get(details.parcel.sourceId) ?? '-'}
                  </p>
                  <p>
                    <strong>Destination:</strong>{' '}
                    {branchNameById.get(details.parcel.destinationId) ?? '-'}
                  </p>
                  <p>
                    <strong>Consignment:</strong>{' '}
                    {formatConsignmentLabel(activeConsignment?.serialForDay)}
                  </p>
                  <p>
                    <strong>Charge:</strong> {formatCurrency(details.parcel.chargePsw)}
                  </p>
                  <p>
                    <strong>To Be Paid:</strong> {formatCurrency(details.parcel.plannedToBePaidPsw)}
                  </p>
                  <p>
                    <strong>Paid:</strong> {hasPaid ? 'Yes' : 'No'}
                  </p>
                  <p>
                    <strong>Paid Amount:</strong> {formatCurrency(totalPaidPsw)}
                  </p>
                  <p>
                    <strong>Mode of Payment:</strong>{' '}
                    {paymentMethods.length ? paymentMethods.join(', ') : '-'}
                  </p>
                  <p>
                    <strong>Created:</strong> {formatDate(details.parcel.createdAt)}
                  </p>
                  <p>
                    <strong>Payments:</strong> {details.payments.length}
                  </p>
                  <p>
                    <strong>Delivery Record:</strong>{' '}
                    {details.delivery ? details.delivery.status : 'None'}
                  </p>
                  <p>
                    <strong>Consignments:</strong> {details.consignments.length}
                  </p>
                </div>
              );
            })()
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(editingParcel)}
        onOpenChange={(open) => (!open ? setEditingParcel(null) : null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Incoming Transit Parcel</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-parcel-details">Parcel Details</Label>
              <Input
                id="edit-parcel-details"
                value={editParcelDetails}
                onChange={(event) => setEditParcelDetails(event.target.value)}
                placeholder="Parcel details"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-receiver-name">Receiver Name</Label>
              <Input
                id="edit-receiver-name"
                value={editReceiverName}
                onChange={(event) => setEditReceiverName(event.target.value)}
                placeholder="Receiver full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-receiver-phone">Receiver Telephone</Label>
              <Input
                id="edit-receiver-phone"
                value={editReceiverPhone}
                onChange={(event) => setEditReceiverPhone(event.target.value)}
                placeholder="Receiver telephone"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditingParcel(null)}
              disabled={isUpdatingParcel || isUpdatingCustomer}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={async () => {
                try {
                  await handleSaveIncomingEdits();
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : 'Failed to update parcel');
                }
              }}
              disabled={isUpdatingParcel || isUpdatingCustomer}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
