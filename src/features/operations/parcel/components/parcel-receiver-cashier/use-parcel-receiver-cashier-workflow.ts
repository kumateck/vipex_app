import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useListBranchOptionsQuery, useGetBranchQuery } from '@/features/branches/api/branches.api';
import {
  useAddCustomerCardMutation,
  useCreateCustomerMutation,
  useListCardOptionsQuery,
  useListCustomerCardsQuery,
} from '@/features/customers/api';
import { useGetLocationQuery } from '@/features/locations/api/locations.api';
import { useListUserOptionsQuery } from '@/features/users/api/users.api';
import { CashierType, ParcelStatus } from '@/db/schemas/enums';
import type { ServerListQuery } from '@/services/rtk-query';
import { PermissionKeys } from '@/shared/permissions/constants';
import { useAuthStore } from '@/stores/auth-store';
import {
  type ParcelSearchRow,
  useCollectReceiverAndDeliverMutation,
  useGetParcelDetailsQuery,
  useSearchParcelsQuery,
  useUpdateParcelMutation,
  useWaiveParcelStorageAccrualMutation,
} from '../../api/parcel.api';
import { confirmReceiverDelivery } from './confirm-receiver-delivery';
import { useReceiverCashierDialogState } from './use-receiver-cashier-dialog-state';
import { getQueueFilterBySearch } from './receiver-cashier-utils';

type ParcelReceiverQuery = ServerListQuery<{
  companyId?: string | null;
  destinationId?: string | null;
  status?: number | null;
  senderPaid?: boolean | null;
  hasPickupQueue?: boolean | null;
}>;

export function useParcelReceiverCashierWorkflow() {
  const user = useAuthStore((state) => state.user);
  const companyId = user?.company?.id ?? null;
  const branchId = user?.branch?.id ?? null;
  const canWaiveStorageAccrual = (user?.permissions ?? []).includes(
    PermissionKeys.CanWaiveParcelStorageAccrual,
  );
  const { data: currentBranch } = useGetBranchQuery(branchId ?? '', { skip: !branchId });
  const isPickupQueueEnabled = currentBranch?.usePickupQueue ?? false;

  const [searchInput, setSearchInput] = useState('');
  const [query, setQuery] = useState<ParcelReceiverQuery>({
    page: 1,
    pageSize: 20,
    sort: [{ field: 'pickupQueueNumber', direction: 'asc' }],
    filters: {
      companyId,
      destinationId: branchId,
      status: ParcelStatus.AWAITING_PICKUP,
      senderPaid: false,
      hasPickupQueue: getQueueFilterBySearch(isPickupQueueEnabled),
    },
  });

  const dialog = useReceiverCashierDialogState();
  const selectedParcel = dialog.selectedParcel;

  const [addCustomerCard, { isLoading: isAddingCard }] = useAddCustomerCardMutation();
  const [createCustomer, { isLoading: isCreatingCustomer }] = useCreateCustomerMutation();
  const [collectReceiverAndDeliver, { isLoading: isCollectingPayment }] =
    useCollectReceiverAndDeliverMutation();
  const [waiveParcelStorageAccrual, { isLoading: isWaivingStorage }] =
    useWaiveParcelStorageAccrualMutation();
  const [updateParcel, { isLoading: isUpdatingParcel }] = useUpdateParcelMutation();

  const { data: cardOptions = [] } = useListCardOptionsQuery();
  const { data: staffOptions = [] } = useListUserOptionsQuery(
    companyId && branchId
      ? { companyId, branchId, locationId: selectedParcel?.pickupLocationId ?? undefined }
      : undefined,
    { skip: !companyId || !branchId || !selectedParcel },
  );
  const { data: branchOptions = [] } = useListBranchOptionsQuery(
    { companyId },
    { skip: !companyId },
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
        senderPaid: false,
        hasPickupQueue: getQueueFilterBySearch(isPickupQueueEnabled, prev.search),
      },
    }));
  }, [branchId, companyId, isPickupQueueEnabled]);

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
    () =>
      (parcelDetails?.payments ?? [])
        .filter((payment) => payment.cashierType === CashierType.TOBEPAID)
        .reduce((sum, payment) => sum + payment.grossAmountPsw, 0),
    [parcelDetails?.payments],
  );
  const receiverDuePsw = Math.max((selectedParcel?.plannedToBePaidPsw ?? 0) - receiverPaidPsw, 0);
  const storageOutstandingPsw = parcelDetails?.storageSettlement?.outstandingPsw ?? 0;
  const hasPickupQueue = Boolean(parcelDetails?.pickupQueue);

  useEffect(() => {
    if (!selectedParcel) return;
    dialog.setPaymentAmount((receiverDuePsw / 100).toFixed(2));
  }, [dialog, receiverDuePsw, selectedParcel]);

  useEffect(() => {
    if (!selectedParcel) return;
    dialog.setStoragePaymentAmount((storageOutstandingPsw / 100).toFixed(2));
    dialog.setWaiveStorageAmount((storageOutstandingPsw / 100).toFixed(2));
  }, [dialog, selectedParcel, storageOutstandingPsw]);

  useEffect(() => {
    if (!selectedParcel || mainReceiverCards.length > 0) return;
    dialog.setMainCardMode('new');
    dialog.setMainExistingCardRecordId('');
  }, [dialog, mainReceiverCards.length, selectedParcel]);

  const isSaving =
    isAddingCard ||
    isCreatingCustomer ||
    isCollectingPayment ||
    isUpdatingParcel ||
    isWaivingStorage;

  const handleSearchSubmit = () => {
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
        senderPaid: false,
        hasPickupQueue: getQueueFilterBySearch(isPickupQueueEnabled, term),
      },
    }));
  };

  const handleRequestDelivery = async (parcel: ParcelSearchRow) => {
    try {
      await updateParcel({ id: parcel.id, status: ParcelStatus.HOME_DELIVERY_REQUESTED }).unwrap();
      toast.success('Parcel moved to Home Delivery Requested');
      await listQuery.refetch();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to move parcel to home delivery',
      );
    }
  };

  const handleWaiveStorageAccrual = async () => {
    if (!selectedParcel) return;
    const reason = dialog.waiveStorageReason.trim();
    if (!reason) throw new Error('Enter waiver reason');
    const amount = Number(dialog.waiveStorageAmount || 0);
    if (Number.isNaN(amount) || amount <= 0) throw new Error('Enter waiver amount');

    await waiveParcelStorageAccrual({
      id: selectedParcel.id,
      reason,
      waivedAmountCedis: amount,
    }).unwrap();

    dialog.setWaiveStorageReason('');
    dialog.setStoragePaymentAmount('0.00');
    dialog.setWaiveStorageAmount('0.00');
  };

  const handleConfirmDelivered = async () => {
    if (!selectedParcel) return;
    const destinationBranchName =
      branchOptions.find((branch) => branch.id === selectedParcel.destinationId)?.name ??
      selectedParcel.destinationId;
    const destinationLocationName = pickupLocation?.name ?? selectedParcel.pickupLocationId ?? '-';

    const { receipt } = await confirmReceiverDelivery({
      selectedParcel,
      pickerStaffId: dialog.pickerStaffId,
      paymentAmount: dialog.paymentAmount,
      storagePaymentAmount: dialog.storagePaymentAmount,
      receiverDuePsw,
      storageOutstandingPsw,
      canWaiveStorageAccrual,
      handoverTarget: dialog.handoverTarget,
      mainCardMode: dialog.mainCardMode,
      mainExistingCardRecordId: dialog.mainExistingCardRecordId,
      mainNewCardTypeId: dialog.mainNewCardTypeId,
      mainNewCardNumber: dialog.mainNewCardNumber,
      mainReceiverCards,
      secondCardMode: dialog.secondCardMode,
      secondExistingCardRecordId: dialog.secondExistingCardRecordId,
      secondNewCardTypeId: dialog.secondNewCardTypeId,
      secondNewCardNumber: dialog.secondNewCardNumber,
      secondNewName: dialog.secondNewName,
      secondNewPhone: dialog.secondNewPhone,
      secondReceiverCards,
      paymentMethod: dialog.paymentMethod,
      destinationBranchName,
      destinationLocationName,
      addCustomerCard: (args) => addCustomerCard(args).unwrap(),
      createCustomer: (args) => createCustomer(args).unwrap(),
      collectReceiverAndDeliver: (args) => collectReceiverAndDeliver(args).unwrap(),
    });

    dialog.setLastPrintedReceipt(receipt);
    dialog.setSelectedParcel(null);
    await listQuery.refetch();
  };

  return {
    context: { companyId, branchId, canWaiveStorageAccrual, isPickupQueueEnabled },
    table: {
      query,
      setQuery,
      searchInput,
      setSearchInput,
      rows,
      listQuery,
      handleSearchSubmit,
      handleRequestDelivery,
      openParcelDialog: dialog.openParcelDialog,
      isSaving,
    },
    dialog: {
      ...dialog,
      parcelDetails,
      hasPickupQueue,
      receiverDuePsw,
      storageOutstandingPsw,
      cardOptions,
      staffOptions,
      mainReceiverCards,
      secondReceiverCards,
      handleConfirmDelivered,
      handleWaiveStorageAccrual,
      isSaving,
    },
    receipt: {
      lastPrintedReceipt: dialog.lastPrintedReceipt,
      clearLastPrintedReceipt: () => dialog.setLastPrintedReceipt(null),
    },
  };
}
