import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useGetBranchOperationsSettingsQuery } from '@/features/branches/api/branches.api';
import { useAddCustomerCardMutation, useCreateCustomerMutation } from '@/features/customers/api';
import { ParcelStatus } from '@/db/schemas/enums';
import { PermissionKeys } from '@/shared/permissions/constants';
import { useAuthStore } from '@/stores/auth-store';
import {
  type ParcelSearchRow,
  useCollectReceiverAndDeliverMutation,
  useRequestReceiverOtpMutation,
  useUpdateParcelMutation,
  useVerifyReceiverOtpMutation,
  useWaiveParcelStorageAccrualMutation,
} from '../../api/parcel.api';
import { confirmReceiverDelivery } from './confirm-receiver-delivery';
import { useReceiverCashierDialogState } from './use-receiver-cashier-dialog-state';
import {
  type ParcelReceiverQuery,
  useReceiverCashierResources,
} from './use-receiver-cashier-resources';
import { useReceiverOtpActions } from './use-receiver-otp-actions';
import { getQueueFilterBySearch } from './receiver-cashier-utils';

export function useParcelReceiverCashierWorkflow() {
  const user = useAuthStore((state) => state.user);
  const companyId = user?.company?.id ?? null;
  const branchId = user?.branch?.id ?? null;
  const cashierLocationId = user?.location?.id ?? user?.locationId ?? null;
  const cashierLocationName = user?.location?.name ?? user?.locationName ?? null;
  const canWaiveStorageAccrual = (user?.permissions ?? []).includes(
    PermissionKeys.CanWaiveParcelStorageAccrual,
  );
  const { data: currentBranch } = useGetBranchOperationsSettingsQuery(branchId ?? '', {
    skip: !branchId,
  });
  const isPickupQueueEnabled = currentBranch?.usePickupQueue ?? false;
  const isReceiverOtpRequired = currentBranch?.requireReceiverOtp ?? true;

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
  const [requestReceiverOtp] = useRequestReceiverOtpMutation();
  const [verifyReceiverOtp] = useVerifyReceiverOtpMutation();
  const { handleRequestOtp, handleVerifyOtp } = useReceiverOtpActions({
    dialog,
    requestReceiverOtp,
    verifyReceiverOtp,
  });

  const resources = useReceiverCashierResources({
    companyId,
    branchId,
    cashierLocationId,
    selectedParcel,
    query,
    isPickupQueueEnabled,
  });
  const {
    cardOptions,
    staffOptions,
    branchOptions,
    listQuery,
    rows,
    parcelDetails,
    pickupLocation,
    mainReceiverCards,
    secondReceiverCards,
    receiverDuePsw,
    storageOutstandingPsw,
    hasPickupQueue,
  } = resources;

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

  useEffect(() => {
    if (!selectedParcel) return;
    dialog.setPaymentAmount((receiverDuePsw / 100).toFixed(2));
  }, [dialog, receiverDuePsw, selectedParcel]);

  useEffect(() => {
    if (!selectedParcel) return;
    dialog.setStoragePaymentAmount((storageOutstandingPsw / 100).toFixed(2));
    dialog.setWaiveStorageAmount((storageOutstandingPsw / 100).toFixed(2));
  }, [dialog, selectedParcel, storageOutstandingPsw]);

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
      isReceiverOtpRequired,
      receiverOtpVerificationToken: dialog.otpVerificationToken,
      momoTransactionId: dialog.momoTransactionId || null,
      addCustomerCard: (args) => addCustomerCard(args).unwrap(),
      createCustomer: (args) => createCustomer(args).unwrap(),
      collectReceiverAndDeliver: (args) => collectReceiverAndDeliver(args).unwrap(),
    });

    dialog.setLastPrintedReceipt(receipt);
    dialog.setSelectedParcel(null);
    await listQuery.refetch();
  };

  return {
    context: {
      companyId,
      branchId,
      cashierLocationName,
      canWaiveStorageAccrual,
      isPickupQueueEnabled,
      isReceiverOtpRequired,
    },
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
      handleRequestOtp,
      handleVerifyOtp,
      isSaving,
    },
    receipt: {
      lastPrintedReceipt: dialog.lastPrintedReceipt,
      clearLastPrintedReceipt: () => dialog.setLastPrintedReceipt(null),
    },
  };
}
