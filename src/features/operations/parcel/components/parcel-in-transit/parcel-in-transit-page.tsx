import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';
import { EllipsisVertical } from 'lucide-react';
import { DataTable } from '@/components/datatable';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { formatDateTime } from '@/lib/dates';
import { isOptionalTenDigitPhone, normalizePhoneDigits, phoneLengthMessage } from '@/lib/phone';
import { ParcelStatus, PaymentMethod } from '@/db/schemas/enums';
import type { PaginationMeta } from '@/server/types/pagination.types';
import type { ServerListQuery } from '@/services/rtk-query';
import { useAuthStore } from '@/stores/auth-store';
import { useListBranchOptionsQuery } from '@/features/branches/api/branches.api';
import { useUpdateCustomerMutation } from '@/features/customers/api';
import { useIncomingParcelBatchArrival } from '../../hooks/use-incoming-parcel-batch-arrival';
import {
  type ParcelSearchRow,
  useGetParcelDetailsQuery,
  useLogParcelDiscrepancyMutation,
  useMarkParcelReceivedMutation,
  useSearchParcelsQuery,
  useUpdateParcelMutation,
} from '../../api/parcel.api';
import { CallSenderBadge } from '../call-sender-badge';
import { PaymentStatusLegend } from '../parcel-processed-consignment/payment-status-legend';
import { getConsignmentPaymentStatus } from '../parcel-processed-consignment/payment-status';
import { ConfirmMarkArrivedDialog } from './confirm-mark-arrived-dialog';
import { ConfirmBulkArrivalDialog } from './confirm-bulk-arrival-dialog';
import { EditIncomingTransitParcelDialog } from './edit-incoming-transit-parcel-dialog';
import { LogDiscrepancyDialog } from './log-discrepancy-dialog';
import { ParcelDetailsDialog } from './parcel-details-dialog';

type InTransitView = 'outgoing' | 'incoming';

const EMPTY_META: PaginationMeta = {
  totalRecords: 0,
  totalPages: 1,
  page: 1,
  pageSize: 20,
  hasNextPage: false,
  hasPreviousPage: false,
};
const EMPTY_ROWS: ParcelSearchRow[] = [];

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
  const [arrivalConfirmationParcel, setArrivalConfirmationParcel] =
    useState<ParcelSearchRow | null>(null);
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
  const [markParcelReceived, { isLoading: isUpdatingStatus }] = useMarkParcelReceivedMutation();
  const [logDiscrepancy, { isLoading: isLoggingDiscrepancy }] = useLogParcelDiscrepancyMutation();

  useEffect(() => {
    setQuery((prev) => ({
      ...prev,
      page: 1,
      filters: serverFilters,
    }));
  }, [serverFilters]);

  const handleMarkAsArrived = useCallback(
    async (parcel: ParcelSearchRow) => {
      if (!user?.id) {
        toast.error('Your user account could not be identified');
        return;
      }
      await markParcelReceived({
        id: parcel.id,
        receivedBy: user.id,
        status: ParcelStatus.ARRIVED_AT_DESTINATION,
      }).unwrap();
      toast.success(`Received ${parcel.bookingCode}`);
    },
    [markParcelReceived, user?.id],
  );

  const { data, isLoading, refetch } = useSearchParcelsQuery(query, {
    skip: !companyId || !branchId,
  });
  const rows = data?.data ?? EMPTY_ROWS;
  const batchArrival = useIncomingParcelBatchArrival({ rows, onArrived: refetch });

  const handleSearchSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const term = searchInput.trim();
      batchArrival.clearSelection();
      setQuery((prev) => ({
        ...prev,
        page: 1,
        search: term.length > 0 ? term : undefined,
        filters: serverFilters,
      }));
    },
    [batchArrival, searchInput, serverFilters],
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
  const handleConfirmMarkAsArrived = useCallback(async () => {
    if (!arrivalConfirmationParcel) return;
    try {
      await handleMarkAsArrived(arrivalConfirmationParcel);
      batchArrival.removeSelection(arrivalConfirmationParcel.id);
      await refetch();
      setArrivalConfirmationParcel(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update parcel status');
    }
  }, [arrivalConfirmationParcel, batchArrival, handleMarkAsArrived, refetch]);
  const rowById = useMemo(
    () => new Map((data?.data ?? []).map((row) => [row.id, row])),
    [data?.data],
  );
  const selectedParcelRow = selectedParcelId ? rowById.get(selectedParcelId) : undefined;
  const branchNameById = useMemo(
    () => new Map(branchOptions.map((branch) => [branch.id, branch.name])),
    [branchOptions],
  );
  const rowNumberOffset =
    ((data?.meta.page ?? query.page ?? 1) - 1) *
    (data?.meta.pageSize ?? query.pageSize ?? EMPTY_META.pageSize);

  const columns = useMemo<ColumnDef<ParcelSearchRow>[]>(
    () => [
      ...(view === 'incoming'
        ? ([
            {
              id: 'select',
              header: () => (
                <Checkbox
                  checked={
                    batchArrival.allOnPageSelected
                      ? true
                      : batchArrival.someOnPageSelected
                        ? 'indeterminate'
                        : false
                  }
                  onCheckedChange={(checked) => batchArrival.toggleCurrentPage(checked === true)}
                  aria-label="Select all incoming parcels on this page"
                  disabled={rows.length === 0 || batchArrival.isLoading}
                />
              ),
              enableSorting: false,
              cell: ({ row }: { row: { original: ParcelSearchRow } }) => (
                <Checkbox
                  checked={batchArrival.isSelected(row.original.id)}
                  onCheckedChange={(checked) =>
                    batchArrival.toggleParcel(row.original, checked === true)
                  }
                  aria-label={`Select parcel ${row.original.bookingCode}`}
                  disabled={batchArrival.isLoading}
                />
              ),
            },
          ] satisfies ColumnDef<ParcelSearchRow>[])
        : []),
      {
        id: 'rowNumber',
        header: 'No.',
        enableSorting: false,
        cell: ({ row }) => (
          <span className="tabular-nums text-muted-foreground">
            {rowNumberOffset + row.index + 1}
          </span>
        ),
      },
      {
        id: 'booking',
        header: 'Booking',
        accessorFn: (row) => row.bookingCode,
        cell: ({ row }) => {
          const paymentStatus = getConsignmentPaymentStatus(row.original);
          return (
            <div className="leading-tight">
              <div className="flex items-center gap-2">
                <span
                  className={`h-2.5 w-2.5 shrink-0 rounded-full ${paymentStatus.dotClassName}`}
                />
                <p className="font-medium">{row.original.bookingCode}</p>
              </div>
              <p className="pl-[18px] text-muted-foreground text-xs">
                Sent {formatDate(row.original.consignmentCreatedAt)}
              </p>
            </div>
          );
        },
      },
      {
        id: 'parcel',
        header: 'Parcel',
        accessorFn: (row) => `${row.parcelDetails} ${row.parcelContent}`,
        cell: ({ row }) => (
          <div className="leading-tight">
            <p className="font-medium">{row.original.parcelDetails || '-'}</p>
            <p className="text-muted-foreground text-xs">{row.original.parcelContent || '-'}</p>
          </div>
        ),
      },
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
            <div className="flex items-center gap-1.5">
              <p className="font-medium">{row.original.receiverName ?? '-'}</p>
              {row.original.callSender ? (
                <CallSenderBadge className="h-5 px-1.5 text-[10px]" />
              ) : null}
            </div>
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
        cell: ({ row }) => {
          const outstandingPsw = Math.max(row.original.plannedToBePaidPsw ?? 0, 0);
          return (
            <div className="leading-tight">
              <p className="font-medium">
                {formatConsignmentLabel(row.original.consignmentSerialForDay)}
              </p>
              {outstandingPsw > 0 ? (
                <p className="text-muted-foreground text-xs">
                  Remaining {formatCurrency(outstandingPsw)}
                </p>
              ) : null}
            </div>
          );
        },
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
                  {view === 'incoming' ? 'View Details & QR Code' : 'View Details'}
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
                  <DropdownMenuItem onClick={() => setArrivalConfirmationParcel(parcel)}>
                    Mark Arrived
                  </DropdownMenuItem>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [batchArrival, branchNameById, isUpdatingStatus, rowNumberOffset, rows.length, view],
  );

  const handleSaveIncomingEdits = useCallback(async () => {
    if (!editingParcel) return;

    const nextParcelDetails = editParcelDetails.trim();
    const nextReceiverName = editReceiverName.trim();
    const nextReceiverPhone = normalizePhoneDigits(editReceiverPhone);

    if (nextParcelDetails.length === 0) {
      toast.error('Parcel details is required');
      return;
    }
    if (nextReceiverName.length === 0) {
      toast.error('Receiver name is required');
      return;
    }
    if (!isOptionalTenDigitPhone(nextReceiverPhone)) {
      toast.error(phoneLengthMessage('Receiver telephone'));
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
      toast.success(`Logged discrepancy for ${discrepancyParcel.bookingCode}`);
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
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
              </div>
              <PaymentStatusLegend />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {view === 'incoming' ? (
              <div className="flex flex-wrap items-center justify-end gap-2">
                <Button
                  type="button"
                  onClick={() => batchArrival.setIsConfirmationOpen(true)}
                  disabled={batchArrival.selectedCount === 0 || batchArrival.isLoading}
                >
                  Mark Arrived ({batchArrival.selectedCount})
                </Button>
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
                  batchArrival.clearSelection();
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
              data={rows}
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

      <ParcelDetailsDialog
        open={Boolean(selectedParcelId)}
        onClose={() => setSelectedParcelId(null)}
        details={details}
        isDetailsLoading={isDetailsLoading}
        branchNameById={branchNameById}
        selectedParcelRow={selectedParcelRow}
        formatConsignmentLabel={formatConsignmentLabel}
        formatCurrency={formatCurrency}
        formatDate={formatDate}
        paymentMethodLabel={paymentMethodLabel}
        showQrCode={view === 'incoming'}
      />

      <ConfirmMarkArrivedDialog
        parcel={arrivalConfirmationParcel}
        isConfirming={isUpdatingStatus}
        onCancel={() => setArrivalConfirmationParcel(null)}
        onConfirm={handleConfirmMarkAsArrived}
      />

      <ConfirmBulkArrivalDialog
        open={view === 'incoming' && batchArrival.isConfirmationOpen}
        parcels={batchArrival.selectedParcels}
        isConfirming={batchArrival.isLoading}
        onOpenChange={batchArrival.setIsConfirmationOpen}
        onConfirm={batchArrival.confirmArrival}
      />

      <LogDiscrepancyDialog
        open={view === 'incoming' && discrepancyDialogOpen}
        onOpenChange={(open) => {
          setDiscrepancyDialogOpen(open);
          if (open) return;
          setDiscrepancyParcel(null);
          setMissingTrackingCode('');
          setMissingBookingCode('');
          setDiscrepancyNotes('');
        }}
        discrepancyParcel={discrepancyParcel}
        missingTrackingCode={missingTrackingCode}
        onMissingTrackingCodeChange={setMissingTrackingCode}
        missingBookingCode={missingBookingCode}
        onMissingBookingCodeChange={setMissingBookingCode}
        discrepancyNotes={discrepancyNotes}
        onDiscrepancyNotesChange={setDiscrepancyNotes}
        isLoggingDiscrepancy={isLoggingDiscrepancy}
        onCancel={() => {
          setDiscrepancyParcel(null);
          setDiscrepancyDialogOpen(false);
          setMissingTrackingCode('');
          setMissingBookingCode('');
          setDiscrepancyNotes('');
        }}
        onSave={handleLogDiscrepancy}
      />

      <EditIncomingTransitParcelDialog
        open={Boolean(editingParcel)}
        onClose={() => setEditingParcel(null)}
        editParcelDetails={editParcelDetails}
        onEditParcelDetailsChange={setEditParcelDetails}
        editReceiverName={editReceiverName}
        onEditReceiverNameChange={setEditReceiverName}
        editReceiverPhone={editReceiverPhone}
        onEditReceiverPhoneChange={setEditReceiverPhone}
        isSaving={isUpdatingParcel || isUpdatingCustomer}
        onSave={handleSaveIncomingEdits}
      />
    </div>
  );
}
