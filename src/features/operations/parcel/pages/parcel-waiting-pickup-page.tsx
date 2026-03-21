import { useEffect, useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';
import { DataTable } from '@/components/datatable';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ParcelStatus } from '@/db/schemas/enums';
import type { PaginationMeta } from '@/server/types/pagination.types';
import type { ServerListQuery } from '@/services/rtk-query';
import {
  useAddCustomerCardMutation,
  useCreateCustomerMutation,
  useListCardOptionsQuery,
  useListCustomerCardsQuery,
} from '@/features/customers/api';
import { useListUserOptionsQuery } from '@/features/users/api/users.api';
import { useAuthStore } from '@/stores/auth-store';
import {
  type ParcelSearchRow,
  useGetParcelDetailsQuery,
  useSearchParcelsQuery,
  useUpdateParcelMutation,
} from '../api/parcel.api';

function formatCurrency(amountPsw: number) {
  return `GHS ${(amountPsw / 100).toFixed(2)}`;
}

type CardMode = 'existing' | 'new';
type HandoverTarget = 'main' | 'second';
const EMPTY_META: PaginationMeta = {
  totalRecords: 0,
  totalPages: 1,
  page: 1,
  pageSize: 20,
  hasNextPage: false,
  hasPreviousPage: false,
};

export function ParcelWaitingPickupPage() {
  const user = useAuthStore((state) => state.user);
  const companyId = user?.company?.id ?? null;
  const branchId = user?.branch?.id ?? null;

  const [searchInput, setSearchInput] = useState('');
  const [query, setQuery] = useState<
    ServerListQuery<{
      companyId?: string | null;
      destinationId?: string | null;
      status?: number | null;
      senderPaid?: boolean | null;
    }>
  >({
    page: 1,
    pageSize: 20,
    filters: {
      companyId,
      destinationId: branchId,
      status: ParcelStatus.AWAITING_PICKUP,
      senderPaid: true,
    },
  });
  const [selectedParcel, setSelectedParcel] = useState<ParcelSearchRow | null>(null);
  const [handoverTarget, setHandoverTarget] = useState<HandoverTarget>('main');
  const [pickerStaffId, setPickerStaffId] = useState('');

  const [mainCardMode, setMainCardMode] = useState<CardMode>('existing');
  const [mainExistingCardRecordId, setMainExistingCardRecordId] = useState('');
  const [mainNewCardTypeId, setMainNewCardTypeId] = useState('');
  const [mainNewCardNumber, setMainNewCardNumber] = useState('');

  const [secondCardMode, setSecondCardMode] = useState<CardMode>('new');
  const [secondExistingCardRecordId, setSecondExistingCardRecordId] = useState('');
  const [secondNewCardTypeId, setSecondNewCardTypeId] = useState('');
  const [secondNewCardNumber, setSecondNewCardNumber] = useState('');
  const [secondNewName, setSecondNewName] = useState('');
  const [secondNewPhone, setSecondNewPhone] = useState('');

  const [updateParcel, { isLoading: isUpdatingParcel }] = useUpdateParcelMutation();
  const [addCustomerCard, { isLoading: isAddingCard }] = useAddCustomerCardMutation();
  const [createCustomer, { isLoading: isCreatingCustomer }] = useCreateCustomerMutation();

  const { data: cardOptions = [] } = useListCardOptionsQuery();
  const { data: staffOptions = [] } = useListUserOptionsQuery(
    companyId && branchId ? { companyId, branchId } : undefined,
    { skip: !companyId || !branchId },
  );

  const listQuery = useSearchParcelsQuery(query, { skip: !companyId || !branchId });
  const rows = listQuery.data?.data ?? [];

  useEffect(() => {
    setQuery((prev) => ({
      ...prev,
      page: 1,
      filters: {
        companyId,
        destinationId: branchId,
        status: ParcelStatus.AWAITING_PICKUP,
        senderPaid: true,
      },
    }));
  }, [branchId, companyId]);

  const { data: parcelDetails } = useGetParcelDetailsQuery(selectedParcel?.id ?? '', {
    skip: !selectedParcel?.id,
  });
  const { data: mainReceiverCards = [] } = useListCustomerCardsQuery(
    { customerId: selectedParcel?.receiverId ?? '' },
    { skip: !selectedParcel?.receiverId },
  );
  const { data: secondReceiverCards = [] } = useListCustomerCardsQuery(
    { customerId: selectedParcel?.secondReceiverId ?? '' },
    { skip: !selectedParcel?.secondReceiverId },
  );

  const isSaving = isUpdatingParcel || isAddingCard || isCreatingCustomer;

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
        id: 'charge',
        header: 'Charge',
        accessorFn: (row) => formatCurrency(row.chargePsw),
      },
      {
        id: 'action',
        header: 'Action',
        enableSorting: false,
        cell: ({ row }) => (
          <Button
            size="sm"
            onClick={() => {
              setSelectedParcel(row.original);
              setHandoverTarget(row.original.secondReceiverId ? 'second' : 'main');
              setPickerStaffId('');
              setMainCardMode('existing');
              setMainExistingCardRecordId('');
              setMainNewCardTypeId('');
              setMainNewCardNumber('');
              setSecondCardMode('new');
              setSecondExistingCardRecordId('');
              setSecondNewCardTypeId('');
              setSecondNewCardNumber('');
              setSecondNewName('');
              setSecondNewPhone('');
            }}
          >
            View Details
          </Button>
        ),
      },
    ],
    [],
  );

  async function resolveCardForCustomer(input: {
    customerId: string;
    mode: CardMode;
    existingRecordId: string;
    existingCards: Array<{ id: string; cardId: string; cardNumber: string }>;
    newCardTypeId: string;
    newCardNumber: string;
  }): Promise<{ cardId: string; cardNumber: string }> {
    if (input.mode === 'existing') {
      const found = input.existingCards.find((card) => card.id === input.existingRecordId);
      if (!found) throw new Error('Select an existing card');
      return { cardId: found.cardId, cardNumber: found.cardNumber };
    }

    const cardId = input.newCardTypeId.trim();
    const cardNumber = input.newCardNumber.trim();
    if (!cardId || !cardNumber) throw new Error('Select card type and enter card number');

    await addCustomerCard({
      customerId: input.customerId,
      cardId,
      cardNumber,
    }).unwrap();

    return { cardId, cardNumber };
  }

  async function handleConfirmDelivered() {
    if (!selectedParcel) return;
    if (!pickerStaffId) {
      toast.error('Select shelf picker staff');
      return;
    }

    const mainCard = await resolveCardForCustomer({
      customerId: selectedParcel.receiverId,
      mode: mainCardMode,
      existingRecordId: mainExistingCardRecordId,
      existingCards: mainReceiverCards,
      newCardTypeId: mainNewCardTypeId,
      newCardNumber: mainNewCardNumber,
    });

    let secondReceiverId = selectedParcel.secondReceiverId;
    let secondCard: { cardId: string; cardNumber: string } | null = null;

    if (handoverTarget === 'second') {
      if (!secondReceiverId) {
        const fullname = secondNewName.trim();
        const telephone = secondNewPhone.trim();
        if (!fullname || !telephone) {
          toast.error('Second receiver name and telephone are required');
          return;
        }
        const created = await createCustomer({ fullname, telephone }).unwrap();
        secondReceiverId = created.id;
      }

      secondCard = await resolveCardForCustomer({
        customerId: secondReceiverId,
        mode: secondCardMode,
        existingRecordId: secondExistingCardRecordId,
        existingCards: secondReceiverCards,
        newCardTypeId: secondNewCardTypeId,
        newCardNumber: secondNewCardNumber,
      });
    }

    await updateParcel({
      id: selectedParcel.id,
      status: ParcelStatus.DELIVERED_BY_OFFICE,
      confirmedBy: pickerStaffId,
      cardId: mainCard.cardId,
      cardNumber: mainCard.cardNumber,
      secondReceiverId: secondReceiverId ?? null,
      secondCardId: secondCard?.cardId ?? null,
      secondCardNumber: secondCard?.cardNumber ?? null,
    }).unwrap();

    toast.success('Parcel marked as DELIVERED_BY_OFFICE');
    setSelectedParcel(null);
    await listQuery.refetch();
  }

  return (
    <div className="w-full p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Waiting for Pickup</CardTitle>
          <CardDescription>
            Sender-paid parcels awaiting office pickup and identity verification.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            className="flex items-center gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              const term = searchInput.trim();
              setQuery((prev) => ({
                ...prev,
                page: 1,
                search: term.length > 0 ? term : undefined,
                filters: {
                  companyId,
                  destinationId: branchId,
                  status: ParcelStatus.AWAITING_PICKUP,
                  senderPaid: true,
                },
              }));
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
            data={rows}
            columns={columns}
            meta={listQuery.data?.meta ?? EMPTY_META}
            loading={listQuery.isLoading}
            showSearch={false}
            serverFilters={{
              companyId,
              destinationId: branchId,
              status: ParcelStatus.AWAITING_PICKUP,
              senderPaid: true,
            }}
            onRequestChange={(next) =>
              setQuery((prev) => ({
                ...prev,
                ...next,
                search: prev.search,
                filters: {
                  companyId,
                  destinationId: branchId,
                  status: ParcelStatus.AWAITING_PICKUP,
                  senderPaid: true,
                },
              }))
            }
            enableVirtualization={false}
          />
        </CardContent>
      </Card>

      <Dialog
        open={Boolean(selectedParcel)}
        onOpenChange={(open) => (!open ? setSelectedParcel(null) : null)}
      >
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Pickup Verification</DialogTitle>
          </DialogHeader>
          {!selectedParcel ? null : (
            <div className="space-y-4">
              <div className="grid gap-2 text-sm">
                <p>
                  <strong>Tracking:</strong> {selectedParcel.trackingCode}
                </p>
                <p>
                  <strong>Booking:</strong> {selectedParcel.bookingCode}
                </p>
                <p>
                  <strong>Receiver:</strong> {selectedParcel.receiverName ?? '-'} (
                  {selectedParcel.receiverPhone ?? '-'})
                </p>
                <p>
                  <strong>Parcel:</strong> {selectedParcel.parcelDetails}
                </p>
                <p>
                  <strong>Content:</strong> {selectedParcel.parcelContent}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Shelf Picker Staff</Label>
                <Select value={pickerStaffId} onValueChange={setPickerStaffId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select staff" />
                  </SelectTrigger>
                  <SelectContent>
                    {staffOptions.map((staff) => (
                      <SelectItem key={staff.id} value={staff.id}>
                        {staff.fullname}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 rounded-md border p-3">
                <Label>Main Receiver ID Card (required)</Label>
                <Select
                  value={mainCardMode}
                  onValueChange={(value) => setMainCardMode(value as CardMode)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="existing">Use existing card</SelectItem>
                    <SelectItem value="new">Add new card</SelectItem>
                  </SelectContent>
                </Select>
                {mainCardMode === 'existing' ? (
                  <Select
                    value={mainExistingCardRecordId}
                    onValueChange={setMainExistingCardRecordId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select existing card" />
                    </SelectTrigger>
                    <SelectContent>
                      {mainReceiverCards.map((card) => (
                        <SelectItem key={card.id} value={card.id}>
                          {card.cardName} - {card.cardNumber}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="grid gap-2 md:grid-cols-2">
                    <Select value={mainNewCardTypeId} onValueChange={setMainNewCardTypeId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select card type" />
                      </SelectTrigger>
                      <SelectContent>
                        {cardOptions.map((option) => (
                          <SelectItem key={option.id} value={option.id}>
                            {option.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      value={mainNewCardNumber}
                      onChange={(event) => setMainNewCardNumber(event.target.value)}
                      placeholder="Card number"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2 rounded-md border p-3">
                <Label>Who Collected Parcel</Label>
                <Select
                  value={handoverTarget}
                  onValueChange={(value) => setHandoverTarget(value as HandoverTarget)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="main">Main Receiver</SelectItem>
                    <SelectItem value="second">Second Receiver</SelectItem>
                  </SelectContent>
                </Select>

                {handoverTarget === 'second' ? (
                  <div className="space-y-3">
                    {!selectedParcel.secondReceiverId ? (
                      <div className="grid gap-2 md:grid-cols-2">
                        <Input
                          value={secondNewName}
                          onChange={(event) => setSecondNewName(event.target.value)}
                          placeholder="Second receiver full name"
                        />
                        <Input
                          value={secondNewPhone}
                          onChange={(event) => setSecondNewPhone(event.target.value)}
                          placeholder="Second receiver telephone"
                        />
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Using linked second receiver for this parcel.
                      </p>
                    )}

                    <Select
                      value={secondCardMode}
                      onValueChange={(value) => setSecondCardMode(value as CardMode)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="existing">Use existing card</SelectItem>
                        <SelectItem value="new">Add new card</SelectItem>
                      </SelectContent>
                    </Select>

                    {secondCardMode === 'existing' ? (
                      <Select
                        value={secondExistingCardRecordId}
                        onValueChange={setSecondExistingCardRecordId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select second receiver card" />
                        </SelectTrigger>
                        <SelectContent>
                          {secondReceiverCards.map((card) => (
                            <SelectItem key={card.id} value={card.id}>
                              {card.cardName} - {card.cardNumber}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="grid gap-2 md:grid-cols-2">
                        <Select value={secondNewCardTypeId} onValueChange={setSecondNewCardTypeId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select card type" />
                          </SelectTrigger>
                          <SelectContent>
                            {cardOptions.map((option) => (
                              <SelectItem key={option.id} value={option.id}>
                                {option.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          value={secondNewCardNumber}
                          onChange={(event) => setSecondNewCardNumber(event.target.value)}
                          placeholder="Second receiver card number"
                        />
                      </div>
                    )}
                  </div>
                ) : null}
              </div>

              {parcelDetails ? (
                <div className="rounded-md border p-3 text-sm">
                  <p>
                    <strong>Payments:</strong> {parcelDetails.payments.length}
                  </p>
                  <p>
                    <strong>Consignments:</strong> {parcelDetails.consignments.length}
                  </p>
                </div>
              ) : null}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedParcel(null)} disabled={isSaving}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                try {
                  await handleConfirmDelivered();
                } catch (error) {
                  toast.error(
                    error instanceof Error ? error.message : 'Failed to confirm delivery',
                  );
                }
              }}
              disabled={isSaving}
            >
              Confirm Delivered
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
