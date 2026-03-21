import { useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';
import { DataTable } from '@/components/datatable';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ParcelStatus } from '@/db/schemas/enums';
import { useCreateCustomerMutation } from '@/features/customers/api';
import { useAuthStore } from '@/stores/auth-store';
import {
  type ParcelSearchRow,
  useSearchParcelsQuery,
  useUpdateParcelMutation,
} from '../api/parcel.api';

const STATUS_LABELS: Record<number, string> = {
  [ParcelStatus.ARRIVED_AT_DESTINATION]: 'Arrived at Destination',
  [ParcelStatus.CUSTOMER_CONTACTED]: 'Customer Contacted',
  [ParcelStatus.AWAITING_PICKUP]: 'Awaiting Pickup',
  [ParcelStatus.HOME_DELIVERY_REQUESTED]: 'Home Delivery Requested',
};

function formatDate(value: string | null | undefined) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString();
}

type ContactOutcome = 'contacted' | 'pickup' | 'delivery' | 'follow_up';

export function ParcelStatusPage() {
  const user = useAuthStore((state) => state.user);
  const companyId = user?.company?.id ?? null;
  const branchId = user?.branch?.id ?? null;

  const [searchInput, setSearchInput] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const [selectedParcel, setSelectedParcel] = useState<ParcelSearchRow | null>(null);
  const [outcome, setOutcome] = useState<ContactOutcome>('contacted');
  const [useSecondReceiver, setUseSecondReceiver] = useState(false);
  const [secondReceiverName, setSecondReceiverName] = useState('');
  const [secondReceiverPhone, setSecondReceiverPhone] = useState('');

  const [updateParcel, { isLoading: isUpdatingParcel }] = useUpdateParcelMutation();
  const [createCustomer, { isLoading: isCreatingCustomer }] = useCreateCustomerMutation();

  const baseQuery = useMemo(
    () => ({
      page: 1,
      pageSize: 200,
      search: submittedSearch.trim().length > 0 ? submittedSearch.trim() : undefined,
    }),
    [submittedSearch],
  );

  const arrivedQuery = useSearchParcelsQuery(
    {
      ...baseQuery,
      filters: {
        companyId,
        destinationId: branchId,
        status: ParcelStatus.ARRIVED_AT_DESTINATION,
      },
    },
    { skip: !companyId || !branchId },
  );

  const contactedQuery = useSearchParcelsQuery(
    {
      ...baseQuery,
      filters: {
        companyId,
        destinationId: branchId,
        status: ParcelStatus.CUSTOMER_CONTACTED,
      },
    },
    { skip: !companyId || !branchId },
  );

  const rows = useMemo(() => {
    const merged = [...(arrivedQuery.data?.data ?? []), ...(contactedQuery.data?.data ?? [])];
    return merged.toSorted((a, b) => {
      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();
      return bTime - aTime;
    });
  }, [arrivedQuery.data?.data, contactedQuery.data?.data]);

  const loading = arrivedQuery.isLoading || contactedQuery.isLoading;
  const isSaving = isUpdatingParcel || isCreatingCustomer;

  const columns = useMemo<ColumnDef<ParcelSearchRow>[]>(
    () => [
      { accessorKey: 'trackingCode', header: 'Tracking' },
      { accessorKey: 'bookingCode', header: 'Booking' },
      { accessorKey: 'parcelDetails', header: 'Parcel Details' },
      { accessorKey: 'parcelContent', header: 'Parcel Content' },
      {
        id: 'receiver',
        header: 'Receiver',
        accessorFn: (row) =>
          `${row.receiverName ?? '-'}${row.receiverPhone ? ` (${row.receiverPhone})` : ''}`,
      },
      {
        id: 'status',
        header: 'Status',
        accessorFn: (row) => STATUS_LABELS[row.status] ?? String(row.status),
      },
      {
        id: 'createdAt',
        header: 'Created',
        accessorFn: (row) => formatDate(row.createdAt),
      },
      {
        id: 'actions',
        header: 'Actions',
        enableSorting: false,
        cell: ({ row }) => (
          <Button
            size="sm"
            onClick={() => {
              setSelectedParcel(row.original);
              setOutcome('contacted');
              setUseSecondReceiver(false);
              setSecondReceiverName('');
              setSecondReceiverPhone('');
            }}
          >
            Call Outcome
          </Button>
        ),
      },
    ],
    [],
  );

  async function refreshQueues() {
    await Promise.all([arrivedQuery.refetch(), contactedQuery.refetch()]);
  }

  async function handleSaveOutcome() {
    if (!selectedParcel) return;

    let nextStatus: number = ParcelStatus.CUSTOMER_CONTACTED;
    if (outcome === 'pickup') nextStatus = ParcelStatus.AWAITING_PICKUP;
    if (outcome === 'delivery') nextStatus = ParcelStatus.HOME_DELIVERY_REQUESTED;
    if (outcome === 'follow_up') nextStatus = ParcelStatus.CUSTOMER_CONTACTED;

    let secondReceiverId = selectedParcel.secondReceiverId ?? null;

    if (useSecondReceiver) {
      const name = secondReceiverName.trim();
      const phone = secondReceiverPhone.trim();
      if (name.length === 0 || phone.length === 0) {
        toast.error('Second receiver name and telephone are required');
        return;
      }
      const created = await createCustomer({
        fullname: name,
        telephone: phone,
      }).unwrap();
      secondReceiverId = created.id;
    }

    await updateParcel({
      id: selectedParcel.id,
      status: nextStatus,
      secondReceiverId,
    }).unwrap();

    toast.success('Parcel contact outcome saved');
    setSelectedParcel(null);
    await refreshQueues();
  }

  return (
    <div className="w-full p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Parcel Status (Call Receivers)</CardTitle>
          <CardDescription>
            Queue includes parcels that are Arrived at Destination and Customer Contacted.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            className="flex items-center gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              setSubmittedSearch(searchInput.trim());
            }}
          >
            <Input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search by tracking, booking, receiver name or phone"
              className="h-11 text-base"
            />
            <Button type="submit" className="h-11 px-6" disabled={!companyId || !branchId}>
              Search
            </Button>
          </form>

          <DataTable
            mode="client"
            data={rows}
            columns={columns}
            loading={loading}
            showSearch={false}
            enableVirtualization={false}
          />
        </CardContent>
      </Card>

      <Dialog open={Boolean(selectedParcel)} onOpenChange={(open) => (!open ? setSelectedParcel(null) : null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Call Outcome</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {selectedParcel ? `Tracking: ${selectedParcel.trackingCode}` : ''}
            </p>

            <div className="space-y-2">
              <Label>Outcome</Label>
              <div className="grid grid-cols-1 gap-2">
                <Button type="button" variant={outcome === 'contacted' ? 'default' : 'outline'} onClick={() => setOutcome('contacted')}>
                  Picked call / SMS sent (Contacted)
                </Button>
                <Button type="button" variant={outcome === 'pickup' ? 'default' : 'outline'} onClick={() => setOutcome('pickup')}>
                  Customer will come (Awaiting Pickup)
                </Button>
                <Button type="button" variant={outcome === 'delivery' ? 'default' : 'outline'} onClick={() => setOutcome('delivery')}>
                  Customer wants delivery
                </Button>
                <Button type="button" variant={outcome === 'follow_up' ? 'default' : 'outline'} onClick={() => setOutcome('follow_up')}>
                  Customer will get back
                </Button>
              </div>
            </div>

            {outcome === 'pickup' ? (
              <div className="space-y-3 rounded-md border p-3">
                <Button
                  type="button"
                  variant={useSecondReceiver ? 'default' : 'outline'}
                  onClick={() => setUseSecondReceiver((prev) => !prev)}
                >
                  {useSecondReceiver ? 'Second Receiver Enabled' : 'Use Second Receiver'}
                </Button>

                {useSecondReceiver ? (
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="second-receiver-name">Second Receiver Name</Label>
                      <Input
                        id="second-receiver-name"
                        value={secondReceiverName}
                        onChange={(event) => setSecondReceiverName(event.target.value)}
                        placeholder="Full name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="second-receiver-phone">Second Receiver Telephone</Label>
                      <Input
                        id="second-receiver-phone"
                        value={secondReceiverPhone}
                        onChange={(event) => setSecondReceiverPhone(event.target.value)}
                        placeholder="Telephone number"
                      />
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setSelectedParcel(null)} disabled={isSaving}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={async () => {
                try {
                  await handleSaveOutcome();
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : 'Failed to save outcome');
                }
              }}
              disabled={isSaving}
            >
              Save Outcome
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
