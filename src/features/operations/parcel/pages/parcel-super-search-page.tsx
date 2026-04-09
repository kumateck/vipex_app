import { useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { EllipsisVertical, Search } from 'lucide-react';
import { DataTable } from '@/components/datatable';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { ParcelDispositionActionType, ParcelStatus, PaymentMethod } from '@/db/schemas/enums';
import type { PaginationMeta } from '@/server/types/pagination.types';
import type { ServerListQuery } from '@/services/rtk-query';
import { useAuthStore } from '@/stores/auth-store';
import { useListBranchOptionsQuery } from '@/features/branches/api/branches.api';
import { useListWarehouseOptionsQuery } from '@/features/warehouses';
import { useListAuditLogsQuery } from '@/features/audit/api';
import { formatDateTime } from '@/lib/date';
import {
  type ParcelSearchRow,
  useGetParcelDetailsQuery,
  useRecordParcelDispositionActionMutation,
  useSearchParcelsQuery,
} from '../api/parcel.api';
import { ParcelInternalHolderBadge } from '../components/parcel-internal-holder-badge';

const EMPTY_META: PaginationMeta = {
  totalRecords: 0,
  totalPages: 1,
  page: 1,
  pageSize: 20,
  hasNextPage: false,
  hasPreviousPage: false,
};

const PARCEL_STATUS_LABELS: Record<number, string> = {
  [ParcelStatus.CREATED]: 'Created',
  [ParcelStatus.PROCESSED]: 'Processed',
  [ParcelStatus.IN_TRANSIT]: 'In Transit',
  [ParcelStatus.ARRIVED_AT_DESTINATION]: 'Arrived at Destination',
  [ParcelStatus.CUSTOMER_CONTACTED]: 'Customer Contacted',
  [ParcelStatus.AWAITING_PICKUP]: 'Awaiting Pickup',
  [ParcelStatus.DELIVERED_BY_OFFICE]: 'Delivered by Office',
  [ParcelStatus.HOME_DELIVERY_REQUESTED]: 'Home Delivery Requested',
  [ParcelStatus.ADDRESS_COLLECTED]: 'Address Collected',
  [ParcelStatus.DISPATCHED]: 'Dispatched',
  [ParcelStatus.RIDER_GIVEN_PARCEL_TO_CUSTOMER]: 'Rider Given Parcel To Customer',
  [ParcelStatus.DELIVERED_AT_HOME]: 'Delivered at Home',
  [ParcelStatus.RETURNED_TO_OFFICE]: 'Returned to Office',
  [ParcelStatus.RETURNED_TO_SENDER]: 'Returned to Sender',
  [ParcelStatus.CANCELLED]: 'Cancelled',
  [ParcelStatus.DISCREPANCY]: 'Discrepancy',
  [ParcelStatus.AGED_IN_WAREHOUSE]: 'Aged in Warehouse',
  [ParcelStatus.DISPOSED_BY_SALE]: 'Disposed by Sale',
  [ParcelStatus.DISPOSED_BY_DESTRUCTION]: 'Disposed by Destruction',
  [ParcelStatus.DISPOSED_BY_DONATION]: 'Disposed by Donation',
};

const formatCurrency = (amountPsw: number) => `GHS ${(amountPsw / 100).toFixed(2)}`;

function formatDate(value: string | null | undefined) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return formatDateTime(date);
}

function paymentMethodLabel(method: number) {
  const label = PaymentMethod[method];
  return typeof label === 'string' ? label : String(method);
}

function detailRow(label: string, value: string | number | null | undefined) {
  return (
    <div className="grid grid-cols-3 gap-2 text-sm" key={label}>
      <span className="text-muted-foreground">{label}</span>
      <span className="col-span-2 break-words">
        {value == null || value === '' ? '-' : String(value)}
      </span>
    </div>
  );
}

export function ParcelSuperSearchPage() {
  const user = useAuthStore((state) => state.user);
  const companyId = user?.company?.id ?? null;

  const [searchInput, setSearchInput] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const [query, setQuery] = useState<
    ServerListQuery<{ companyId?: string | null; includeDeleted?: boolean | null }>
  >({
    page: 1,
    pageSize: 20,
    filters: { companyId, includeDeleted: true },
  });
  const [selectedParcelId, setSelectedParcelId] = useState<string | null>(null);
  const [dispositionNotes, setDispositionNotes] = useState('');
  const [dispositionWarehouseId, setDispositionWarehouseId] = useState('');
  const [dispositionRecoveryAmount, setDispositionRecoveryAmount] = useState('');

  const shouldSearch = submittedSearch.trim().length > 0;

  const { data, isLoading } = useSearchParcelsQuery(
    {
      ...query,
      search: shouldSearch ? submittedSearch.trim() : undefined,
      filters: { companyId, includeDeleted: true },
    },
    {
      skip: !companyId || !shouldSearch,
    },
  );

  const { data: parcelDetails, isFetching: isDetailsLoading } = useGetParcelDetailsQuery(
    selectedParcelId ?? '',
    { skip: !selectedParcelId },
  );
  const [recordDispositionAction, { isLoading: isRecordingDispositionAction }] =
    useRecordParcelDispositionActionMutation();

  const { data: branchOptions = [] } = useListBranchOptionsQuery(
    { companyId },
    { skip: !companyId },
  );
  const branchNameById = useMemo(
    () => new Map(branchOptions.map((branch) => [branch.id, branch.name])),
    [branchOptions],
  );
  const selectedDestinationBranchId = parcelDetails?.parcel.destinationId ?? null;
  const { data: warehouseOptions = [] } = useListWarehouseOptionsQuery(
    {
      companyId: companyId ?? '',
      branchId: selectedDestinationBranchId ?? '',
      activeOnly: true,
    },
    { skip: !companyId || !selectedDestinationBranchId },
  );

  const rows = data?.data ?? [];
  const rowById = useMemo(() => new Map(rows.map((row) => [row.id, row])), [rows]);
  const selectedParcelRow = selectedParcelId ? rowById.get(selectedParcelId) : undefined;
  const { data: deletedAuditLogs } = useListAuditLogsQuery(
    {
      page: 1,
      pageSize: 1,
      sort: [{ field: 'createdAt', direction: 'desc' }],
      filters: {
        entityType: 'parcel',
        entityId: selectedParcelId ?? undefined,
        action: 'PARCEL_SOFT_DELETED',
      },
    },
    { skip: !selectedParcelId || !selectedParcelRow?.isDeleted },
  );

  const submitSearch = () => {
    setSubmittedSearch(searchInput.trim());
    setQuery((prev) => ({ ...prev, page: 1, filters: { companyId, includeDeleted: true } }));
  };

  async function handleRecordDispositionAction(actionType: number) {
    if (!selectedParcelId) return;
    try {
      await recordDispositionAction({
        id: selectedParcelId,
        actionType,
        notes: dispositionNotes.trim() || null,
        warehouseId:
          actionType === ParcelDispositionActionType.TRANSFERRED_TO_WAREHOUSE
            ? dispositionWarehouseId || null
            : null,
        recoveredAmountCedis: dispositionRecoveryAmount.trim() || null,
      }).unwrap();

      setDispositionNotes('');
      setDispositionRecoveryAmount('');
      if (actionType !== ParcelDispositionActionType.TRANSFERRED_TO_WAREHOUSE) {
        setDispositionWarehouseId('');
      }
    } catch {
      // Error feedback is handled by API middleware.
    }
  }

  const columns = useMemo<ColumnDef<ParcelSearchRow>[]>(
    () => [
      { accessorKey: 'trackingCode', header: 'Tracking' },
      { accessorKey: 'bookingCode', header: 'Booking' },
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
      {
        id: 'status',
        header: 'Status',
        accessorFn: (row) => PARCEL_STATUS_LABELS[row.status] ?? String(row.status),
      },
      {
        id: 'destination',
        header: 'Destination',
        accessorFn: (row) => branchNameById.get(row.destinationId) ?? '-',
      },
      {
        id: 'holder',
        header: 'Current Holder',
        cell: ({ row }) => <ParcelInternalHolderBadge holder={row.original} />,
      },
      {
        id: 'actions',
        header: 'Action',
        enableSorting: false,
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="outline" className="h-8 w-8">
                <EllipsisVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSelectedParcelId(row.original.id)}>
                View Details
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [branchNameById],
  );

  return (
    <div className="w-full p-4 space-y-4">
      <ScrollableWrapper>
        <Card>
          <CardHeader>
            <CardTitle>All Parcels Super Search</CardTitle>
            <CardDescription>
              Search by sender/receiver name or phone, booking code, or tracking code.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form
              className="flex items-center gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                if (!companyId || searchInput.trim().length === 0) return;
                submitSearch();
              }}
            >
              <Input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Enter sender/receiver name, telephone, booking code, or tracking code"
                className="h-11 text-base"
              />
              <Button
                type="submit"
                className="h-11 px-6"
                onClick={submitSearch}
                disabled={!companyId || searchInput.trim().length === 0}
              >
                <Search className="mr-2 h-4 w-4" />
                Search
              </Button>
            </form>

            {shouldSearch ? (
              <DataTable
                mode="server"
                data={rows}
                columns={columns}
                meta={data?.meta ?? EMPTY_META}
                loading={isLoading}
                showSearch={false}
                serverFilters={{ companyId, includeDeleted: true }}
                onRequestChange={setQuery}
                enableVirtualization={false}
              />
            ) : (
              <div className="rounded-md border border-dashed p-8 text-center text-muted-foreground">
                Enter a search term and click Search to see parcel records.
              </div>
            )}
          </CardContent>
        </Card>
      </ScrollableWrapper>

      <Dialog
        open={Boolean(selectedParcelId)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedParcelId(null);
            setDispositionNotes('');
            setDispositionWarehouseId('');
            setDispositionRecoveryAmount('');
          }
        }}
      >
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Parcel Details</DialogTitle>
          </DialogHeader>

          {!parcelDetails || isDetailsLoading ? (
            <div className="py-10 text-center text-muted-foreground">Loading details...</div>
          ) : (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Parcel Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {parcelDetails.parcel.isDeleted ? (
                    <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm">
                      {(() => {
                        const deletedLog = deletedAuditLogs?.data?.[0];
                        const metadata =
                          deletedLog?.metadata && typeof deletedLog.metadata === 'object'
                            ? (deletedLog.metadata as { reason?: unknown })
                            : null;
                        const reason =
                          parcelDetails.parcel.deleteReason &&
                          parcelDetails.parcel.deleteReason.trim().length > 0
                            ? parcelDetails.parcel.deleteReason
                            : typeof metadata?.reason === 'string' &&
                                metadata.reason.trim().length > 0
                              ? metadata.reason
                              : 'No reason provided';
                        const deletedBy =
                          deletedLog?.actorUserName ?? deletedLog?.actorUserId ?? 'Unknown user';
                        return (
                          <span>
                            This parcel was deleted by <strong>{deletedBy}</strong> for reason:{' '}
                            <strong>{reason}</strong>. Please consult the person before proceeding.
                          </span>
                        );
                      })()}
                    </div>
                  ) : null}
                  {detailRow('Tracking', parcelDetails.parcel.trackingCode)}
                  {detailRow('Booking', parcelDetails.parcel.bookingCode)}
                  {detailRow(
                    'Status',
                    PARCEL_STATUS_LABELS[parcelDetails.parcel.status] ??
                      parcelDetails.parcel.status,
                  )}
                  {detailRow(
                    'Source Branch',
                    branchNameById.get(parcelDetails.parcel.sourceId) ?? '-',
                  )}
                  {detailRow(
                    'Destination Branch',
                    branchNameById.get(parcelDetails.parcel.destinationId) ?? '-',
                  )}
                  {detailRow('Destination Location', selectedParcelRow?.pickupLocationName ?? '-')}
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <span className="text-muted-foreground">Current Holder</span>
                    <div className="col-span-2">
                      <ParcelInternalHolderBadge holder={parcelDetails.internalHolder} />
                    </div>
                  </div>
                  {detailRow('Parcel Details', parcelDetails.parcel.parcelDetails)}
                  {detailRow('Parcel Content', parcelDetails.parcel.parcelContent)}
                  {detailRow('Charge', formatCurrency(parcelDetails.parcel.chargePsw))}
                  {detailRow(
                    'Planned To Be Paid',
                    formatCurrency(parcelDetails.parcel.plannedToBePaidPsw),
                  )}
                  {detailRow('Payment Method', paymentMethodLabel(parcelDetails.parcel.method))}
                  {detailRow('Created At', formatDate(parcelDetails.parcel.createdAt))}
                  {detailRow('Received At', formatDate(parcelDetails.parcel.receivedAt))}
                  {detailRow('Confirmed At', formatDate(parcelDetails.parcel.confirmedAt))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Payment Records ({parcelDetails.payments.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {parcelDetails.payments.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No payments recorded.</p>
                  ) : (
                    parcelDetails.payments.map((payment) => (
                      <div key={payment.id} className="rounded-md border p-3 text-sm space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium">
                            {formatCurrency(payment.grossAmountPsw)}
                          </span>
                          <Badge variant="outline">Receipt: {payment.receiptNo ?? '-'}</Badge>
                        </div>
                        <p className="text-muted-foreground">
                          Received: {formatDate(payment.receivedAt)}
                        </p>
                        <p className="text-muted-foreground">
                          Method: {paymentMethodLabel(payment.method)}
                        </p>
                        {payment.notes ? <p>Notes: {payment.notes}</p> : null}
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Delivery Record</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {!parcelDetails.delivery ? (
                    <p className="text-sm text-muted-foreground">No delivery record found.</p>
                  ) : (
                    <>
                      {detailRow('Mode', parcelDetails.delivery.mode)}
                      {detailRow('Status', parcelDetails.delivery.status)}
                      {detailRow('Dropoff Address', parcelDetails.delivery.dropoffAddress)}
                      {detailRow(
                        'Delivery Charge',
                        formatCurrency(parcelDetails.delivery.chargePsw),
                      )}
                      {detailRow(
                        'Amount Paid',
                        formatCurrency(parcelDetails.delivery.amountPaidPsw),
                      )}
                      {detailRow('Delivered At', formatDate(parcelDetails.delivery.deliveredAt))}
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Aged Parcel Actions ({parcelDetails.dispositionActions.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="disposition-notes">Action Notes</Label>
                      <Input
                        id="disposition-notes"
                        value={dispositionNotes}
                        onChange={(event) => setDispositionNotes(event.target.value)}
                        placeholder="Reason, notice details, or decision context"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="disposition-recovery">Recovered Amount (GHS)</Label>
                      <Input
                        id="disposition-recovery"
                        value={dispositionRecoveryAmount}
                        onChange={(event) => setDispositionRecoveryAmount(event.target.value)}
                        placeholder="0.00"
                        inputMode="decimal"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="disposition-warehouse">Warehouse (for transfer action)</Label>
                    <select
                      id="disposition-warehouse"
                      value={dispositionWarehouseId}
                      onChange={(event) => setDispositionWarehouseId(event.target.value)}
                      className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                    >
                      <option value="">Select warehouse</option>
                      {warehouseOptions.map((warehouse) => (
                        <option key={warehouse.id} value={warehouse.id}>
                          {warehouse.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isRecordingDispositionAction}
                      onClick={() =>
                        void handleRecordDispositionAction(ParcelDispositionActionType.NOTICE_SENT)
                      }
                    >
                      Notice Sent
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isRecordingDispositionAction}
                      onClick={() =>
                        void handleRecordDispositionAction(
                          ParcelDispositionActionType.TRANSFERRED_TO_WAREHOUSE,
                        )
                      }
                    >
                      Transfer To Warehouse
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isRecordingDispositionAction}
                      onClick={() =>
                        void handleRecordDispositionAction(ParcelDispositionActionType.SOLD)
                      }
                    >
                      Mark Sold
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isRecordingDispositionAction}
                      onClick={() =>
                        void handleRecordDispositionAction(ParcelDispositionActionType.DESTROYED)
                      }
                    >
                      Mark Destroyed
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isRecordingDispositionAction}
                      onClick={() =>
                        void handleRecordDispositionAction(ParcelDispositionActionType.DONATED)
                      }
                    >
                      Mark Donated
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isRecordingDispositionAction}
                      onClick={() =>
                        void handleRecordDispositionAction(ParcelDispositionActionType.WRITTEN_OFF)
                      }
                    >
                      Write Off
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {parcelDetails.dispositionActions.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No disposition actions recorded yet.
                      </p>
                    ) : (
                      parcelDetails.dispositionActions.map((action) => (
                        <div key={action.id} className="rounded-md border p-3 text-sm space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-medium">
                              {ParcelDispositionActionType[action.actionType] ??
                                `Action ${action.actionType}`}
                            </p>
                            <span className="text-muted-foreground text-xs">
                              {formatDate(action.performedAt)}
                            </span>
                          </div>
                          <p className="text-muted-foreground text-xs">
                            By: {action.performedByName ?? '-'}
                          </p>
                          {action.warehouseName ? (
                            <p className="text-muted-foreground text-xs">
                              Warehouse: {action.warehouseName}
                            </p>
                          ) : null}
                          {action.recoveredAmountPsw > 0 ? (
                            <p className="text-muted-foreground text-xs">
                              Recovered: {formatCurrency(action.recoveredAmountPsw)}
                            </p>
                          ) : null}
                          {action.notes ? <p className="text-xs">{action.notes}</p> : null}
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Consignment History ({parcelDetails.consignments.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {parcelDetails.consignments.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No consignment association found.
                    </p>
                  ) : (
                    parcelDetails.consignments.map((consignment) => (
                      <div
                        key={`${consignment.consignmentId}-${consignment.addedAt}`}
                        className="rounded-md border p-3 text-sm"
                      >
                        <p className="font-medium">{consignment.code}</p>
                        <p className="text-muted-foreground">
                          Date: {formatDate(consignment.consignmentDate)}
                        </p>
                        <p className="text-muted-foreground">
                          Route: {branchNameById.get(consignment.sourceId) ?? '-'} to{' '}
                          {branchNameById.get(consignment.destinationId) ?? '-'}
                        </p>
                        <p className="text-muted-foreground">
                          Added: {formatDate(consignment.addedAt)}
                        </p>
                        <p className="text-muted-foreground">
                          Removed: {formatDate(consignment.removedAt)}
                        </p>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
