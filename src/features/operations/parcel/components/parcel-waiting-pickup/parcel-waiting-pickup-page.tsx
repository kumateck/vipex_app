import { useEffect, useMemo, useState } from 'react';
import { formatDateTime as sharedFormatDateTime } from '@/lib/dates';
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
import { useGetBranchQuery } from '@/features/branches/api/branches.api';
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
} from '../../api/parcel.api';
import { PickupVerificationDialog } from './pickup-verification-dialog';

function formatCurrency(amountPsw: number) {
  return `GHS ${(amountPsw / 100).toFixed(2)}`;
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return sharedFormatDateTime(value);
}

function formatPhones(primary?: string | null, secondary?: string | null) {
  const phones = [primary, secondary].filter((value): value is string => Boolean(value?.trim()));
  return phones.length ? phones.join(', ') : '-';
}

function getPaymentType(row: Pick<ParcelSearchRow, 'chargePsw' | 'plannedToBePaidPsw'>) {
  const charge = Number(row.chargePsw ?? 0);
  const receiverDue = Math.max(Number(row.plannedToBePaidPsw ?? 0), 0);

  if (receiverDue <= 0) {
    return { dotClassName: 'bg-emerald-500' };
  }

  if (receiverDue >= charge) {
    return { dotClassName: 'bg-amber-500' };
  }

  return { dotClassName: 'bg-sky-500' };
}

function getQueueFilterBySearch(isPickupQueueEnabled: boolean, search?: string) {
  if (!isPickupQueueEnabled) return undefined;
  return search?.trim() ? undefined : true;
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
  const { data: currentBranch } = useGetBranchQuery(branchId ?? '', { skip: !branchId });
  const isPickupQueueEnabled = currentBranch?.usePickupQueue ?? false;

  const [searchInput, setSearchInput] = useState('');
  const [query, setQuery] = useState<
    ServerListQuery<{
      companyId?: string | null;
      destinationId?: string | null;
      status?: number | null;
      senderPaid?: boolean | null;
      hasPickupQueue?: boolean | null;
    }>
  >({
    page: 1,
    pageSize: 20,
    sort: [{ field: 'pickupQueueNumber', direction: 'asc' }],
    filters: {
      companyId,
      destinationId: branchId,
      status: ParcelStatus.AWAITING_PICKUP,
      senderPaid: true,
      hasPickupQueue: getQueueFilterBySearch(isPickupQueueEnabled),
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
    companyId && branchId
      ? {
          companyId,
          branchId,
          locationId: selectedParcel?.pickupLocationId ?? undefined,
        }
      : undefined,
    { skip: !companyId || !branchId || !selectedParcel },
  );

  const shouldSearchOnly = !isPickupQueueEnabled;
  const hasSearchTerm = Boolean(query.search?.trim());
  const listQuery = useSearchParcelsQuery(query, {
    skip: !companyId || !branchId || (shouldSearchOnly && !hasSearchTerm),
  });
  const rows = listQuery.data?.data ?? [];

  useEffect(() => {
    setQuery((prev) => ({
      ...prev,
      page: 1,
      sort: [{ field: 'pickupQueueNumber', direction: 'asc' }],
      filters: {
        companyId,
        destinationId: branchId,
        status: ParcelStatus.AWAITING_PICKUP,
        senderPaid: true,
        hasPickupQueue: getQueueFilterBySearch(isPickupQueueEnabled, prev.search),
      },
    }));
  }, [branchId, companyId, isPickupQueueEnabled]);

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

  useEffect(() => {
    if (!selectedParcel) return;
    if (mainReceiverCards.length === 0) {
      setMainCardMode('new');
      setMainExistingCardRecordId('');
    }
  }, [mainReceiverCards.length, selectedParcel]);

  const isSaving = isUpdatingParcel || isAddingCard || isCreatingCustomer;
  const hasPickupQueue = Boolean(parcelDetails?.pickupQueue);

  function openParcelDialog(parcel: ParcelSearchRow) {
    setSelectedParcel(parcel);
    setHandoverTarget(parcel.secondReceiverId ? 'second' : 'main');
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
  }

  const columns = useMemo<ColumnDef<ParcelSearchRow>[]>(() => {
    const baseColumns: ColumnDef<ParcelSearchRow>[] = [
      {
        accessorKey: 'bookingCode',
        header: 'Booking',
        cell: ({ row }) => {
          const paymentType = getPaymentType(row.original);
          return (
            <div className="inline-flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${paymentType.dotClassName}`} />
              <span>{row.original.bookingCode}</span>
            </div>
          );
        },
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
      { accessorKey: 'parcelDetails', header: 'Parcel Details' },
      { accessorKey: 'parcelContent', header: 'Parcel Content' },
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
      {
        id: 'source',
        header: 'Source',
        cell: ({ row }) => (
          <div className="leading-tight">
            <p className="font-medium">{row.original.sourceLocationName ?? '-'}</p>
            <p className="text-muted-foreground text-xs">{row.original.sourceName ?? '-'}</p>
          </div>
        ),
      },
      {
        id: 'destination',
        header: 'Destination',
        cell: ({ row }) => (
          <div className="leading-tight">
            <p className="font-medium">{row.original.pickupLocationName ?? '-'}</p>
            <p className="text-muted-foreground text-xs">{row.original.destinationName ?? '-'}</p>
          </div>
        ),
      },
      {
        id: 'charge',
        header: 'Charge',
        accessorFn: (row) => formatCurrency(row.chargePsw),
      },
    ];

    if (isPickupQueueEnabled) {
      baseColumns.push({
        id: 'pickupQueue',
        header: 'Queue Code',
        accessorFn: (row) => row.pickupQueueCode ?? '-',
      });
    }

    baseColumns.push({
      id: 'action',
      header: 'Action',
      enableSorting: false,
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" variant="outline" className="h-8 w-8" disabled={isSaving}>
              <EllipsisVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => openParcelDialog(row.original)}>
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem
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
                    error instanceof Error
                      ? error.message
                      : 'Failed to move parcel to home delivery',
                  );
                }
              }}
            >
              Request Delivery
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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

  async function handleMoveToHomeDelivery() {
    if (!selectedParcel) return;

    await updateParcel({
      id: selectedParcel.id,
      status: ParcelStatus.HOME_DELIVERY_REQUESTED,
    }).unwrap();

    toast.success('Parcel moved to Home Delivery Requested');
    setSelectedParcel(null);
    await listQuery.refetch();
  }

  return (
    <div className="w-full p-4 space-y-4">
      <ScrollableWrapper>
        <Card>
          <CardHeader>
            <CardTitle>Waiting for Pickup</CardTitle>
            <CardDescription>
              {isPickupQueueEnabled
                ? 'Sender-paid parcels awaiting office pickup and identity verification.'
                : 'Search for a sender-paid parcel to process pickup at this branch.'}
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
                  sort: [{ field: 'pickupQueueNumber', direction: 'asc' }],
                  search: term.length > 0 ? term : undefined,
                  filters: {
                    companyId,
                    destinationId: branchId,
                    status: ParcelStatus.AWAITING_PICKUP,
                    senderPaid: true,
                    hasPickupQueue: getQueueFilterBySearch(isPickupQueueEnabled, term),
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
                senderPaid: true,
                hasPickupQueue: getQueueFilterBySearch(isPickupQueueEnabled, query.search),
              }}
              onRequestChange={(next) =>
                setQuery((prev) => ({
                  ...prev,
                  ...next,
                  search: prev.search,
                  sort:
                    isPickupQueueEnabled && !prev.search?.trim()
                      ? [{ field: 'pickupQueueNumber', direction: 'asc' }]
                      : next.sort,
                  filters: {
                    companyId,
                    destinationId: branchId,
                    status: ParcelStatus.AWAITING_PICKUP,
                    senderPaid: true,
                    hasPickupQueue: getQueueFilterBySearch(isPickupQueueEnabled, prev.search),
                  },
                }))
              }
              enableVirtualization={false}
            />
          </CardContent>
        </Card>
      </ScrollableWrapper>

      <PickupVerificationDialog
        open={Boolean(selectedParcel)}
        parcel={selectedParcel}
        onClose={() => setSelectedParcel(null)}
        pickerStaffId={pickerStaffId}
        onPickerStaffIdChange={setPickerStaffId}
        staffOptions={staffOptions}
        isPickupQueueEnabled={isPickupQueueEnabled}
        hasPickupQueue={hasPickupQueue}
        parcelDetails={parcelDetails}
        formatDateTime={formatDateTime}
        mainCardMode={mainCardMode}
        onMainCardModeChange={(value) => setMainCardMode(value as CardMode)}
        mainExistingCardRecordId={mainExistingCardRecordId}
        onMainExistingCardRecordIdChange={setMainExistingCardRecordId}
        mainNewCardTypeId={mainNewCardTypeId}
        onMainNewCardTypeIdChange={setMainNewCardTypeId}
        mainNewCardNumber={mainNewCardNumber}
        onMainNewCardNumberChange={setMainNewCardNumber}
        mainReceiverCards={mainReceiverCards}
        handoverTarget={handoverTarget}
        onHandoverTargetChange={(value) => setHandoverTarget(value as HandoverTarget)}
        secondNewName={secondNewName}
        onSecondNewNameChange={setSecondNewName}
        secondNewPhone={secondNewPhone}
        onSecondNewPhoneChange={setSecondNewPhone}
        secondCardMode={secondCardMode}
        onSecondCardModeChange={(value) => setSecondCardMode(value as CardMode)}
        secondExistingCardRecordId={secondExistingCardRecordId}
        onSecondExistingCardRecordIdChange={setSecondExistingCardRecordId}
        secondNewCardTypeId={secondNewCardTypeId}
        onSecondNewCardTypeIdChange={setSecondNewCardTypeId}
        secondNewCardNumber={secondNewCardNumber}
        onSecondNewCardNumberChange={setSecondNewCardNumber}
        secondReceiverCards={secondReceiverCards}
        cardOptions={cardOptions}
        isSaving={isSaving}
        onRequestHomeDelivery={handleMoveToHomeDelivery}
        onConfirmDelivered={handleConfirmDelivered}
      />
    </div>
  );
}
