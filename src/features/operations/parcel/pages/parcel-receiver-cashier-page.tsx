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
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useListBranchOptionsQuery } from '@/features/branches/api/branches.api';
import { useGetBranchQuery } from '@/features/branches/api/branches.api';
import {
  useAddCustomerCardMutation,
  useCreateCustomerMutation,
  useListCardOptionsQuery,
  useListCustomerCardsQuery,
} from '@/features/customers/api';
import { useGetLocationQuery } from '@/features/locations/api/locations.api';
import { useListUserOptionsQuery } from '@/features/users/api/users.api';
import { ParcelStatus, PaymentMethod } from '@/db/schemas/enums';
import type { PaginationMeta } from '@/server/types/pagination.types';
import type { ServerListQuery } from '@/services/rtk-query';
import { useAuthStore } from '@/stores/auth-store';
import {
  type ParcelSearchRow,
  useCollectReceiverAndDeliverMutation,
  useGetParcelDetailsQuery,
  useSearchParcelsQuery,
  useUpdateParcelMutation,
} from '../api/parcel.api';
import { ParcelInternalHolderBadge } from '../components/parcel-internal-holder-badge';
import { ParcelReceiptActions, type ReceiptPrintData } from '../components/parcel-receipt-actions';
import { ParcelSessionGuard } from '../components/parcel-session-guard';

function formatCurrency(amountPsw: number) {
  return `GHS ${(amountPsw / 100).toFixed(2)}`;
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString();
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

const PAYMENT_METHOD_OPTIONS = [
  { value: PaymentMethod.CASH, label: 'Cash' },
  { value: PaymentMethod.MTN, label: 'MTN' },
  { value: PaymentMethod.TELECEL, label: 'Telecel' },
  { value: PaymentMethod.AIRTEL, label: 'Airtel' },
];

export function ParcelReceiverCashierPage() {
  const user = useAuthStore((state) => state.user);
  const companyId = user?.company?.id ?? null;
  const branchId = user?.branch?.id ?? null;
  const { data: currentBranch } = useGetBranchQuery(branchId ?? '', { skip: !branchId });
  const isPickupQueueEnabled = currentBranch?.usePickupQueue ?? false;

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
      senderPaid: false,
    },
  });
  const [selectedParcel, setSelectedParcel] = useState<ParcelSearchRow | null>(null);
  const [handoverTarget, setHandoverTarget] = useState<HandoverTarget>('main');
  const [pickerStaffId, setPickerStaffId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<string>(String(PaymentMethod.CASH));
  const [paymentAmount, setPaymentAmount] = useState('');
  const [lastPrintedReceipt, setLastPrintedReceipt] = useState<ReceiptPrintData | null>(null);

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

  const [addCustomerCard, { isLoading: isAddingCard }] = useAddCustomerCardMutation();
  const [createCustomer, { isLoading: isCreatingCustomer }] = useCreateCustomerMutation();
  const [collectReceiverAndDeliver, { isLoading: isCollectingPayment }] =
    useCollectReceiverAndDeliverMutation();
  const [updateParcel, { isLoading: isUpdatingParcel }] = useUpdateParcelMutation();

  const { data: cardOptions = [] } = useListCardOptionsQuery();
  const { data: staffOptions = [] } = useListUserOptionsQuery(
    companyId && branchId ? { companyId, branchId } : undefined,
    { skip: !companyId || !branchId },
  );
  const { data: branchOptions = [] } = useListBranchOptionsQuery(
    { companyId },
    { skip: !companyId },
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
        senderPaid: false,
      },
    }));
  }, [branchId, companyId]);

  const { data: parcelDetails } = useGetParcelDetailsQuery(selectedParcel?.id ?? '', {
    skip: !selectedParcel?.id,
  });
  const { data: pickupLocation } = useGetLocationQuery(selectedParcel?.pickupLocationId ?? '', {
    skip: !selectedParcel?.pickupLocationId,
  });
  const { data: mainReceiverCards = [] } = useListCustomerCardsQuery(
    { customerId: selectedParcel?.receiverId ?? '' },
    { skip: !selectedParcel?.receiverId },
  );
  const { data: secondReceiverCards = [] } = useListCustomerCardsQuery(
    { customerId: selectedParcel?.secondReceiverId ?? '' },
    { skip: !selectedParcel?.secondReceiverId },
  );

  const receiverPaidPsw = useMemo(
    () => (parcelDetails?.payments ?? []).reduce((sum, payment) => sum + payment.grossAmountPsw, 0),
    [parcelDetails?.payments],
  );
  const receiverDuePsw = Math.max((selectedParcel?.plannedToBePaidPsw ?? 0) - receiverPaidPsw, 0);

  useEffect(() => {
    if (!selectedParcel) return;
    setPaymentAmount((receiverDuePsw / 100).toFixed(2));
  }, [receiverDuePsw, selectedParcel]);

  useEffect(() => {
    if (!selectedParcel) return;
    if (mainReceiverCards.length === 0) {
      setMainCardMode('new');
      setMainExistingCardRecordId('');
    }
  }, [mainReceiverCards.length, selectedParcel]);

  const isSaving = isAddingCard || isCreatingCustomer || isCollectingPayment || isUpdatingParcel;
  const hasPickupQueue = Boolean(parcelDetails?.pickupQueue);

  function openParcelDialog(parcel: ParcelSearchRow) {
    setSelectedParcel(parcel);
    setHandoverTarget(parcel.secondReceiverId ? 'second' : 'main');
    setPickerStaffId('');
    setPaymentMethod(String(PaymentMethod.CASH));
    setPaymentAmount((parcel.plannedToBePaidPsw / 100).toFixed(2));
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
  }

  const columns = useMemo<ColumnDef<ParcelSearchRow>[]>(() => {
    const baseColumns: ColumnDef<ParcelSearchRow>[] = [
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
        id: 'receiverDue',
        header: 'Receiver Due',
        accessorFn: (row) => formatCurrency(row.plannedToBePaidPsw),
      },
      {
        id: 'holder',
        header: 'Current Holder',
        cell: ({ row }) => <ParcelInternalHolderBadge holder={row.original} />,
      },
    ];

    if (isPickupQueueEnabled) {
      baseColumns.push({
        id: 'pickupQueue',
        header: 'Queue',
        accessorFn: (row) =>
          row.pickupQueueCode
            ? `${row.pickupQueueCode}${row.pickupQueuedAt ? ` • ${formatDateTime(row.pickupQueuedAt)}` : ''}`
            : 'Not queued',
      });
    }

    baseColumns.push({
      id: 'action',
      header: 'Action',
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => openParcelDialog(row.original)}>
            Receive + Deliver
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={async () => {
              try {
                await updateParcel({
                  id: row.original.id,
                  status: ParcelStatus.HOME_DELIVERY_REQUESTED,
                }).unwrap();
                toast.success('Parcel moved to Home Delivery Requested');
                await listQuery.refetch();
              } catch (error) {
                toast.error(
                  error instanceof Error ? error.message : 'Failed to move parcel to home delivery',
                );
              }
            }}
            disabled={isSaving}
          >
            Request Delivery
          </Button>
        </div>
      ),
    });

    return baseColumns;
  }, [isPickupQueueEnabled, isSaving, listQuery, updateParcel]);

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

    if (receiverDuePsw > 0) {
      const amountValue = Number(paymentAmount);
      const dueCedis = receiverDuePsw / 100;
      if (Number.isNaN(amountValue) || amountValue <= 0) {
        toast.error('Enter a valid payment amount');
        return;
      }
      if (Math.abs(amountValue - dueCedis) > 0.00001) {
        toast.error(`Receiver cashier must collect exactly GHS ${dueCedis.toFixed(2)}`);
        return;
      }
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

    const receiverDueBeforePsw = receiverDuePsw;
    const deliveryResult = await collectReceiverAndDeliver({
      parcelId: selectedParcel.id,
      amountCedis: receiverDueBeforePsw > 0 ? Number(paymentAmount) : null,
      method: Number(paymentMethod),
      confirmedBy: pickerStaffId,
      cardId: mainCard.cardId,
      cardNumber: mainCard.cardNumber,
      secondReceiverId: secondReceiverId ?? null,
      secondCardId: secondCard?.cardId ?? null,
      secondCardNumber: secondCard?.cardNumber ?? null,
    }).unwrap();
    const payment = deliveryResult.payment ?? undefined;

    const totalChargeCedis = selectedParcel.chargePsw / 100;
    const receiverPaidCedis = receiverDueBeforePsw / 100;
    const senderPaidCedis = Math.max(totalChargeCedis - receiverPaidCedis, 0);
    const destinationBranchName =
      branchOptions.find((branch) => branch.id === selectedParcel.destinationId)?.name ??
      selectedParcel.destinationId;
    const destinationLocationName = pickupLocation?.name ?? selectedParcel.pickupLocationId ?? '-';
    const linkedSecondReceiverName =
      (selectedParcel as { secondReceiverName?: string | null }).secondReceiverName ?? null;
    const receivedByName =
      handoverTarget === 'second'
        ? secondNewName.trim() || linkedSecondReceiverName || 'Second Receiver'
        : (selectedParcel.receiverName ?? '-');

    setLastPrintedReceipt({
      bookingCode: selectedParcel.bookingCode,
      trackingCode: selectedParcel.trackingCode,
      parcelDetails: selectedParcel.parcelDetails,
      parcelContent: selectedParcel.parcelContent,
      parcelValueCedis: Number(selectedParcel.parcelValuePsw ?? 0) / 100,
      receivedByName,
      senderName: selectedParcel.senderName ?? '-',
      senderTelephone: selectedParcel.senderPhone ?? '-',
      receiverName: selectedParcel.receiverName ?? '-',
      receiverTelephone: selectedParcel.receiverPhone ?? '-',
      destinationBranchName,
      destinationLocationName,
      totalChargeCedis,
      senderPaidCedis,
      receiverToPayCedis: 0,
      amountPaidCedis: receiverPaidCedis,
      issuedAt: new Date().toISOString(),
      taxBreakdown: payment
        ? {
            vatCedis: payment.amounts.vatCedis,
            getfundCedis: payment.amounts.getfundCedis,
            nhilCedis: payment.amounts.nhilCedis,
            covidCedis: payment.amounts.covidCedis,
            taxTotalCedis: payment.amounts.taxTotalCedis,
          }
        : undefined,
    });

    toast.success('Payment received and parcel marked as DELIVERED_BY_OFFICE');
    setSelectedParcel(null);
    await listQuery.refetch();
  }

  return (
    <div className="w-full p-4 space-y-4">
      <ParcelSessionGuard>
        <ScrollableWrapper>
          <Card>
            <CardHeader>
              <CardTitle>Receiver Cashier</CardTitle>
              <CardDescription>
                Receiver-pay parcels awaiting payment collection and office handover.
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
                      senderPaid: false,
                    },
                  }));
                }}
              >
                <Input
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Search by tracking, booking, telephone, or receiver name"
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
                  senderPaid: false,
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
                      senderPaid: false,
                    },
                  }))
                }
                enableVirtualization={false}
              />
            </CardContent>
          </Card>
        </ScrollableWrapper>

        <Dialog
          open={Boolean(selectedParcel)}
          onOpenChange={(open) => (!open ? setSelectedParcel(null) : null)}
        >
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Receiver Payment + Pickup Verification</DialogTitle>
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
                  <div className="flex items-center gap-2">
                    <strong>Current Holder:</strong>
                    <ParcelInternalHolderBadge
                      holder={parcelDetails?.internalHolder ?? selectedParcel}
                    />
                  </div>
                  <p>
                    <strong>Receiver Due:</strong> {formatCurrency(receiverDuePsw)}
                  </p>
                </div>

                <div className="space-y-2 rounded-md border p-3">
                  <Label htmlFor="receiver-payment-amount">Payment Amount (GHS)</Label>
                  <Input
                    id="receiver-payment-amount"
                    inputMode="decimal"
                    value={paymentAmount}
                    onChange={(event) => setPaymentAmount(event.target.value)}
                    placeholder="0.00"
                    disabled={receiverDuePsw <= 0}
                  />

                  <Label htmlFor="receiver-payment-method">Payment Method</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger id="receiver-payment-method" disabled={receiverDuePsw <= 0}>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_METHOD_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={String(option.value)}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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

                {isPickupQueueEnabled ? (
                  <div className="space-y-3 rounded-md border p-3">
                    <div>
                      <Label>Pickup Queue</Label>
                      <p className="text-sm text-muted-foreground">
                        Queue tickets are created from the Pickup Queue page before payment and
                        handover.
                      </p>
                    </div>

                    {hasPickupQueue ? (
                      <div className="rounded-md bg-muted/40 p-3 text-sm">
                        <p>
                          <strong>Queue Code:</strong> {parcelDetails?.pickupQueue?.queueCode}
                        </p>
                        <p>
                          <strong>Queue Number:</strong> {parcelDetails?.pickupQueue?.queueNumber}
                        </p>
                        <p>
                          <strong>Queued At:</strong>{' '}
                          {formatDateTime(parcelDetails?.pickupQueue?.queuedAt ?? null)}
                        </p>
                      </div>
                    ) : (
                      <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
                        No queue ticket found yet. Create it from the shared Pickup Queue page, then
                        return here to collect payment and hand over the parcel.
                      </div>
                    )}
                  </div>
                ) : null}

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
                      <SelectItem value="existing" disabled={mainReceiverCards.length === 0}>
                        Use existing card
                      </SelectItem>
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
                          <SelectItem value="existing" disabled={secondReceiverCards.length === 0}>
                            Use existing card
                          </SelectItem>
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
                          <Select
                            value={secondNewCardTypeId}
                            onValueChange={setSecondNewCardTypeId}
                          >
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
              <Button
                variant="outline"
                type="button"
                onClick={() => setSelectedParcel(null)}
                disabled={isSaving}
              >
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
                disabled={isSaving || (isPickupQueueEnabled && !hasPickupQueue)}
              >
                {isSaving ? 'Processing...' : 'Receive Payment + Deliver'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {lastPrintedReceipt ? (
          <ParcelReceiptActions
            data={lastPrintedReceipt}
            autoPrint
            mode="receiver-payment"
            onAutoPrintComplete={() => setLastPrintedReceipt(null)}
          />
        ) : null}
      </ParcelSessionGuard>
    </div>
  );
}
