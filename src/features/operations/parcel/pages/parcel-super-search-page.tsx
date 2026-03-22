import { useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Search } from 'lucide-react';
import { DataTable } from '@/components/datatable';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ParcelStatus, PaymentMethod } from '@/db/schemas/enums';
import type { PaginationMeta } from '@/server/types/pagination.types';
import type { ServerListQuery } from '@/services/rtk-query';
import { useAuthStore } from '@/stores/auth-store';
import { useListBranchOptionsQuery } from '@/features/branches/api/branches.api';
import {
  type ParcelSearchRow,
  useGetParcelDetailsQuery,
  useSearchParcelsQuery,
} from '../api/parcel.api';

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
};

const formatCurrency = (amountPsw: number) => `GHS ${(amountPsw / 100).toFixed(2)}`;

function formatDate(value: string | null | undefined) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString();
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
  const [query, setQuery] = useState<ServerListQuery<{ companyId?: string | null }>>({
    page: 1,
    pageSize: 20,
    filters: { companyId },
  });
  const [selectedParcelId, setSelectedParcelId] = useState<string | null>(null);

  const shouldSearch = submittedSearch.trim().length > 0;

  const { data, isLoading } = useSearchParcelsQuery(
    {
      ...query,
      search: shouldSearch ? submittedSearch.trim() : undefined,
      filters: { companyId },
    },
    {
      skip: !companyId || !shouldSearch,
    },
  );

  const { data: parcelDetails, isFetching: isDetailsLoading } = useGetParcelDetailsQuery(
    selectedParcelId ?? '',
    { skip: !selectedParcelId },
  );

  const { data: branchOptions = [] } = useListBranchOptionsQuery(
    { companyId },
    { skip: !companyId },
  );
  const branchNameById = useMemo(
    () => new Map(branchOptions.map((branch) => [branch.id, branch.name])),
    [branchOptions],
  );

  const rows = data?.data ?? [];

  const submitSearch = () => {
    setSubmittedSearch(searchInput.trim());
    setQuery((prev) => ({ ...prev, page: 1, filters: { companyId } }));
  };

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
        id: 'actions',
        header: 'Actions',
        enableSorting: false,
        cell: ({ row }) => (
          <Button size="sm" variant="outline" onClick={() => setSelectedParcelId(row.original.id)}>
            View Details
          </Button>
        ),
      },
    ],
    [branchNameById],
  );

  return (
    <div className="w-full p-4 space-y-4">
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
              serverFilters={{ companyId }}
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

      <Dialog
        open={Boolean(selectedParcelId)}
        onOpenChange={(open) => (!open ? setSelectedParcelId(null) : null)}
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
                  {detailRow('Tracking', parcelDetails.parcel.trackingCode)}
                  {detailRow('Booking', parcelDetails.parcel.bookingCode)}
                  {detailRow(
                    'Status',
                    PARCEL_STATUS_LABELS[parcelDetails.parcel.status] ??
                      parcelDetails.parcel.status,
                  )}
                  {detailRow(
                    'Source Branch',
                    branchNameById.get(parcelDetails.parcel.sourceId) ??
                      parcelDetails.parcel.sourceId,
                  )}
                  {detailRow(
                    'Destination Branch',
                    branchNameById.get(parcelDetails.parcel.destinationId) ??
                      parcelDetails.parcel.destinationId,
                  )}
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
