import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';
import { EllipsisVertical } from 'lucide-react';
import { DataTable } from '@/components/datatable';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { Textarea } from '@/components/ui/textarea';
import { formatDateTime } from '@/lib/date';
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
  useLogParcelDiscrepancyMutation,
  useSearchParcelsQuery,
  useUpdateParcelMutation,
  useUpdateParcelStatusMutation,
} from '../api/parcel.api';
import { ParcelInternalHolderBadge } from '../components/parcel-internal-holder-badge';

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
  return formatDateTime(date);
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

function formatPhones(primary?: string | null, secondary?: string | null) {
  const phones = [primary, secondary].filter((value): value is string => Boolean(value?.trim()));
  return phones.length ? phones.join(', ') : '-';
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
  const [discrepancyDialogOpen, setDiscrepancyDialogOpen] = useState(false);
  const [discrepancyParcel, setDiscrepancyParcel] = useState<ParcelSearchRow | null>(null);
  const [missingTrackingCode, setMissingTrackingCode] = useState('');
  const [missingBookingCode, setMissingBookingCode] = useState('');
  const [discrepancyNotes, setDiscrepancyNotes] = useState('');
  const [updateParcel, { isLoading: isUpdatingParcel }] = useUpdateParcelMutation();
  const [updateCustomer, { isLoading: isUpdatingCustomer }] = useUpdateCustomerMutation();
  const [updateParcelStatus, { isLoading: isUpdatingStatus }] = useUpdateParcelStatusMutation();
  const [logDiscrepancy, { isLoading: isLoggingDiscrepancy }] = useLogParcelDiscrepancyMutation();

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
  const rowById = useMemo(
    () => new Map((data?.data ?? []).map((row) => [row.id, row])),
    [data?.data],
  );
  const selectedParcelRow = selectedParcelId ? rowById.get(selectedParcelId) : undefined;
  const branchNameById = useMemo(
    () => new Map(branchOptions.map((branch) => [branch.id, branch.name])),
    [branchOptions],
  );

  const columns = useMemo<ColumnDef<ParcelSearchRow>[]>(
    () => [
      { accessorKey: 'bookingCode', header: 'Booking' },
      { accessorKey: 'parcelDetails', header: 'Parcel Details' },
      { accessorKey: 'parcelContent', header: 'Parcel Content' },
      {
        id: 'sender',
        header: 'Sender',
        cell: ({ row }) => (
          <div className="leading-tight">
            <p className="font-medium">{row.original.senderName ?? '-'}</p>
            <p className="text-muted-foreground text-xs">
              {formatPhones(row.original.senderPhone, row.original.senderPhone2)}
            </p>
          </div>
        ),
      },
      {
        id: 'receiver',
        header: 'Receiver',
        cell: ({ row }) => (
          <div className="leading-tight">
            <p className="font-medium">{row.original.receiverName ?? '-'}</p>
            <p className="text-muted-foreground text-xs">
              {formatPhones(row.original.receiverPhone, row.original.receiverPhone2)}
            </p>
          </div>
        ),
      },
      ...(view === 'incoming'
        ? ([
            {
              id: 'source',
              header: 'Source',
              cell: ({ row }: { row: { original: ParcelSearchRow } }) => (
                <div className="leading-tight">
                  <p className="font-medium">{row.original.sourceLocationName ?? '-'}</p>
                  <p className="text-muted-foreground text-xs">
                    {row.original.sourceName ?? branchNameById.get(row.original.sourceId) ?? '-'}
                  </p>
                </div>
              ),
            },
          ] satisfies ColumnDef<ParcelSearchRow>[])
        : ([
            {
              id: 'destination',
              header: 'Destination',
              cell: ({ row }: { row: { original: ParcelSearchRow } }) => (
                <div className="leading-tight">
                  <p className="font-medium">{row.original.pickupLocationName ?? '-'}</p>
                  <p className="text-muted-foreground text-xs">
                    {branchNameById.get(row.original.destinationId) ?? '-'}
                  </p>
                </div>
              ),
            },
          ] satisfies ColumnDef<ParcelSearchRow>[])),
      {
        id: 'consignment',
        header: 'Consignment',
        accessorFn: (row) => formatConsignmentLabel(row.consignmentSerialForDay),
      },
      {
        id: 'actions',
        header: 'Action',
        enableSorting: false,
        cell: ({ row }) => {
          const parcel = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon"
                  variant="outline"
                  className="h-8 w-8"
                  disabled={isUpdatingStatus}
                >
                  <EllipsisVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setSelectedParcelId(parcel.id)}>
                  View Details
                </DropdownMenuItem>
                {view === 'incoming' ? (
                  <DropdownMenuItem
                    onClick={() => {
                      setEditingParcel(parcel);
                      setEditParcelDetails(parcel.parcelDetails ?? '');
                      setEditReceiverName(parcel.receiverName ?? '');
                      setEditReceiverPhone(parcel.receiverPhone ?? '');
                    }}
                  >
                    Edit
                  </DropdownMenuItem>
                ) : null}
                {view === 'incoming' ? (
                  <DropdownMenuItem
                    onClick={() => {
                      setDiscrepancyParcel(parcel);
                      setDiscrepancyDialogOpen(true);
                      setDiscrepancyNotes('');
                      setMissingTrackingCode(parcel.trackingCode);
                      setMissingBookingCode(parcel.bookingCode);
                    }}
                  >
                    Log Not Physical
                  </DropdownMenuItem>
                ) : null}
                {view === 'incoming' ? (
                  <DropdownMenuItem
                    onClick={async () => {
                      try {
                        await handleMarkAsArrived(parcel);
                        await refetch();
                      } catch (error) {
                        toast.error(
                          error instanceof Error ? error.message : 'Failed to update parcel status',
                        );
                      }
                    }}
                  >
                    Mark Arrived
                  </DropdownMenuItem>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
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

  const handleLogDiscrepancy = useCallback(async () => {
    if (!companyId || !branchId || !user?.id) {
      toast.error('Missing company, branch, or user context');
      return;
    }

    const notes = discrepancyNotes.trim();

    if (discrepancyParcel) {
      await logDiscrepancy({
        companyId,
        actorUserId: user.id,
        branchId,
        parcelId: discrepancyParcel.id,
        trackingCode: discrepancyParcel.trackingCode,
        bookingCode: discrepancyParcel.bookingCode,
        discrepancyType: 'record_not_physical',
        notes: notes.length > 0 ? notes : null,
      }).unwrap();
      toast.success(`Logged discrepancy for ${discrepancyParcel.trackingCode}`);
    } else {
      const trackingCode = missingTrackingCode.trim();
      const bookingCode = missingBookingCode.trim();

      if (trackingCode.length === 0 && bookingCode.length === 0) {
        toast.error('Enter tracking code or booking code');
        return;
      }

      await logDiscrepancy({
        companyId,
        actorUserId: user.id,
        branchId,
        trackingCode: trackingCode.length > 0 ? trackingCode : null,
        bookingCode: bookingCode.length > 0 ? bookingCode : null,
        discrepancyType: 'physical_missing_in_system',
        notes: notes.length > 0 ? notes : null,
      }).unwrap();
      toast.success('Logged missing physical parcel discrepancy');
    }

    setDiscrepancyParcel(null);
    setDiscrepancyDialogOpen(false);
    setMissingTrackingCode('');
    setMissingBookingCode('');
    setDiscrepancyNotes('');
  }, [
    branchId,
    companyId,
    discrepancyNotes,
    discrepancyParcel,
    logDiscrepancy,
    missingBookingCode,
    missingTrackingCode,
    user?.id,
  ]);

  return (
    <div className="w-full p-4 space-y-4">
      <ScrollableWrapper>
        <Card>
          <CardHeader>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {view === 'incoming' ? (
              <div className="flex flex-wrap items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setDiscrepancyParcel(null);
                    setDiscrepancyDialogOpen(true);
                    setMissingTrackingCode('');
                    setMissingBookingCode('');
                    setDiscrepancyNotes('');
                  }}
                >
                  Log Missing Physical Parcel
                </Button>
              </div>
            ) : null}
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
      </ScrollableWrapper>

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
                    <strong>Location:</strong> {selectedParcelRow?.pickupLocationName ?? '-'}
                  </p>
                  <div className="flex items-center gap-2">
                    <strong>Current Holder:</strong>
                    <ParcelInternalHolderBadge holder={details.internalHolder} />
                  </div>
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
        open={view === 'incoming' && discrepancyDialogOpen}
        onOpenChange={(open) => {
          setDiscrepancyDialogOpen(open);
          if (open) return;
          setDiscrepancyParcel(null);
          setMissingTrackingCode('');
          setMissingBookingCode('');
          setDiscrepancyNotes('');
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {discrepancyParcel
                ? 'Log Discrepancy: Record Not Physical'
                : 'Log Discrepancy: Physical Parcel Missing In System'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {discrepancyParcel ? (
              <div className="space-y-2 text-sm">
                <p>
                  <strong>Tracking:</strong> {discrepancyParcel.trackingCode}
                </p>
                <p>
                  <strong>Booking:</strong> {discrepancyParcel.bookingCode}
                </p>
                <p className="text-muted-foreground">
                  Use this when the parcel exists in the incoming in-transit list but the physical
                  item is not available.
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="missing-tracking-code">Tracking Code</Label>
                  <Input
                    id="missing-tracking-code"
                    value={missingTrackingCode}
                    onChange={(event) => setMissingTrackingCode(event.target.value)}
                    placeholder="Enter scanned or printed tracking code"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="missing-booking-code">Booking Code</Label>
                  <Input
                    id="missing-booking-code"
                    value={missingBookingCode}
                    onChange={(event) => setMissingBookingCode(event.target.value)}
                    placeholder="Optional booking code"
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Use this when the parcel is physically present but no matching in-transit record
                  exists in the system.
                </p>
              </>
            )}
            <div className="space-y-2">
              <Label htmlFor="discrepancy-notes">Notes</Label>
              <Textarea
                id="discrepancy-notes"
                value={discrepancyNotes}
                onChange={(event) => setDiscrepancyNotes(event.target.value)}
                placeholder="Describe what was found, who checked, or any follow-up needed"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setDiscrepancyParcel(null);
                setDiscrepancyDialogOpen(false);
                setMissingTrackingCode('');
                setMissingBookingCode('');
                setDiscrepancyNotes('');
              }}
              disabled={isLoggingDiscrepancy}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={async () => {
                try {
                  await handleLogDiscrepancy();
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : 'Failed to log discrepancy');
                }
              }}
              disabled={isLoggingDiscrepancy}
            >
              {isLoggingDiscrepancy ? 'Saving...' : 'Save Discrepancy'}
            </Button>
          </DialogFooter>
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
