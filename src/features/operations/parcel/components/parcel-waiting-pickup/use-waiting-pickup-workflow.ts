import { getErrorMessage as getApplicationErrorMessage } from '@/lib/TheAduseiErrorResponse';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { normalizePhoneDigits, isTenDigitPhone, phoneLengthMessage } from '@/lib/phone';
import { ParcelStatus, UserStatus } from '@/db/schemas/enums';
import { useGetBranchOperationsSettingsQuery } from '@/features/branches/api/branches.api';
import {
  useAddCustomerCardMutation,
  useResolveSecondReceiverMutation,
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
import { resolveCustomerCard } from '../parcel-receiver-cashier/resolve-customer-card';
import { getDialogLoadState, getDialogResourceState, resolveShelfPickerStaffId } from '../../utils';
import { useWaitingPickupDialogState } from './use-waiting-pickup-dialog-state';
import { useWaitingPickUpEdit } from './use-waiting-pickup-edit';
import { getQueueFilterBySearch, type WaitingPickupQuery } from './waiting-pickup-types';

export function useWaitingPickupWorkflow() {
  const user = useAuthStore((state) => state.user);
  const companyId = user?.company?.id ?? null;
  const branchId = user?.branch?.id ?? null;
  const cashierLocationId = user?.location?.id ?? user?.locationId ?? null;
  const cashierLocationName = user?.location?.name ?? user?.locationName ?? null;
  const currentBranchQuery = useGetBranchOperationsSettingsQuery(branchId ?? '', {
    skip: !branchId,
  });
  const currentBranch = currentBranchQuery.data;
  const isPickupQueueEnabled = currentBranch?.usePickupQueue ?? false;
  const isPickupOtpRequired = currentBranch?.requirePickupOtp ?? true;
  const [searchInput, setSearchInput] = useState('');
  const [initializedParcelId, setInitializedParcelId] = useState<string | null>(null);
  const [query, setQuery] = useState<WaitingPickupQuery>({
    page: 1,
    pageSize: 20,
    sort: [{ field: 'pickupQueueNumber', direction: 'asc' }],
    filters: {
      companyId,
      destinationId: branchId,
      status: ParcelStatus.AWAITING_PICKUP,
      cashierCollectionRequired: false,
      hasPickupQueue: getQueueFilterBySearch(isPickupQueueEnabled),
    },
  });
  const dialog = useWaitingPickupDialogState();
  const selectedParcel = dialog.selectedParcel;

  const [updateParcel, { isLoading: isUpdatingParcel }] = useUpdateParcelMutation();
  const [addCustomerCard, { isLoading: isAddingCard }] = useAddCustomerCardMutation();
  const [resolveSecondReceiver, { isLoading: isCreatingCustomer }] =
    useResolveSecondReceiverMutation();
  const cardOptionsQuery = useListCardOptionsQuery();
  const staffOptionsQuery = useListUserOptionsQuery(
    companyId && branchId && cashierLocationId
      ? { companyId, branchId, locationId: cashierLocationId, status: UserStatus.ACTIVE }
      : undefined,
    { skip: !companyId || !branchId || !cashierLocationId || !selectedParcel },
  );
  const hasSearchTerm = Boolean(query.search?.trim());
  const listQuery = useSearchParcelsQuery(query, {
    skip: !companyId || !branchId || (!isPickupQueueEnabled && !hasSearchTerm),
  });
  const parcelDetailsQuery = useGetParcelDetailsQuery(selectedParcel?.id ?? '', {
    skip: !selectedParcel?.id,
  });
  const mainReceiverCardsQuery = useListCustomerCardsQuery(
    { customerId: selectedParcel?.receiverId ?? '' },
    { skip: !selectedParcel?.receiverId },
  );
  const secondReceiverCardsQuery = useListCustomerCardsQuery(
    { customerId: selectedParcel?.secondReceiverId ?? '' },
    { skip: !selectedParcel?.secondReceiverId },
  );
  const cardOptions = cardOptionsQuery.data ?? [];
  const staffOptions = staffOptionsQuery.data ?? [];
  const parcelDetails = parcelDetailsQuery.data;
  const mainReceiverCards = mainReceiverCardsQuery.data ?? [];
  const secondReceiverCards = secondReceiverCardsQuery.data ?? [];
  const dialogLoadState = getDialogLoadState([
    getDialogResourceState(currentBranchQuery, Boolean(selectedParcel && branchId)),
    getDialogResourceState(cardOptionsQuery, Boolean(selectedParcel)),
    getDialogResourceState(
      staffOptionsQuery,
      Boolean(selectedParcel && companyId && branchId && cashierLocationId),
    ),
    getDialogResourceState(parcelDetailsQuery, Boolean(selectedParcel)),
    getDialogResourceState(mainReceiverCardsQuery, Boolean(selectedParcel?.receiverId)),
    getDialogResourceState(secondReceiverCardsQuery, Boolean(selectedParcel?.secondReceiverId)),
  ]);
  const edit = useWaitingPickUpEdit();

  useEffect(() => {
    setQuery((previous) => ({
      ...previous,
      page: 1,
      sort: [{ field: 'pickupQueueNumber', direction: 'asc' }],
      filters: {
        companyId,
        destinationId: branchId,
        status: ParcelStatus.AWAITING_PICKUP,
        cashierCollectionRequired: false,
        hasPickupQueue: getQueueFilterBySearch(isPickupQueueEnabled, previous.search),
      },
    }));
  }, [branchId, companyId, isPickupQueueEnabled]);

  useEffect(() => {
    if (!selectedParcel || !parcelDetails) return;
    dialog.setPickerStaffId(resolveShelfPickerStaffId(parcelDetails));
  }, [dialog.setPickerStaffId, parcelDetails, selectedParcel]);

  useEffect(() => {
    if (
      !selectedParcel ||
      !parcelDetails ||
      dialogLoadState.isLoading ||
      dialogLoadState.hasError
    ) {
      return;
    }
    setInitializedParcelId(selectedParcel.id);
  }, [dialogLoadState.hasError, dialogLoadState.isLoading, parcelDetails, selectedParcel]);

  const isSaving = isUpdatingParcel || isAddingCard || isCreatingCustomer || edit.isSaving;

  const handleSearchSubmit = () => {
    const term = searchInput.trim();
    setQuery((previous) => ({
      ...previous,
      page: 1,
      sort: [{ field: 'pickupQueueNumber', direction: 'asc' }],
      search: term || undefined,
      filters: {
        companyId,
        destinationId: branchId,
        status: ParcelStatus.AWAITING_PICKUP,
        cashierCollectionRequired: false,
        hasPickupQueue: getQueueFilterBySearch(isPickupQueueEnabled, term),
      },
    }));
  };

  const handleRequestDelivery = async (parcel: ParcelSearchRow) => {
    try {
      await updateParcel({ id: parcel.id, status: ParcelStatus.HOME_DELIVERY_REQUESTED }).unwrap();
      toast.success('Parcel moved to Home Delivery Requested');
      if (selectedParcel?.id === parcel.id) dialog.closeParcelDialog();
      await listQuery.refetch();
    } catch (error) {
      toast.error(
        getApplicationErrorMessage(error, '') || 'Failed to move parcel to home delivery',
      );
    }
  };

  const handleConfirmDelivered = async () => {
    if (!selectedParcel) return;
    if (!dialog.pickerStaffId) throw new Error('Select shelf picker staff');
    if (isPickupOtpRequired && (!dialog.otp.otpVerified || !dialog.otp.verificationToken)) {
      throw new Error('Verify the customer collection OTP before confirming delivery');
    }

    const mainCard = await resolveCustomerCard({
      customerId: selectedParcel.receiverId,
      mode: dialog.mainCardMode,
      existingRecordId: dialog.mainExistingCardRecordId,
      existingCards: mainReceiverCards,
      newCardTypeId: dialog.mainNewCardTypeId,
      newCardNumber: dialog.mainNewCardNumber,
      addCustomerCard: (args) => addCustomerCard(args).unwrap(),
    });

    let secondReceiverId = selectedParcel.secondReceiverId;
    let secondCard: { cardId: string; cardNumber: string } | null = null;
    if (dialog.handoverTarget === 'second') {
      if (!secondReceiverId) {
        const fullname = dialog.secondNewName.trim();
        const telephone = normalizePhoneDigits(dialog.secondNewPhone);
        if (!fullname || !telephone)
          throw new Error('Second receiver name and telephone are required');
        if (!isTenDigitPhone(telephone)) {
          throw new Error(phoneLengthMessage('Second receiver telephone'));
        }
        secondReceiverId = (await resolveSecondReceiver({ fullname, telephone }).unwrap()).id;
      }
      secondCard = await resolveCustomerCard({
        customerId: secondReceiverId,
        mode: dialog.secondCardMode,
        existingRecordId: dialog.secondExistingCardRecordId,
        existingCards: secondReceiverCards,
        newCardTypeId: dialog.secondNewCardTypeId,
        newCardNumber: dialog.secondNewCardNumber,
        addCustomerCard: (args) => addCustomerCard(args).unwrap(),
      });
    }

    await updateParcel({
      id: selectedParcel.id,
      status: ParcelStatus.DELIVERED_BY_OFFICE,
      confirmedBy: dialog.pickerStaffId,
      cardId: mainCard?.cardId ?? null,
      cardNumber: mainCard?.cardNumber ?? null,
      secondReceiverId: secondReceiverId ?? null,
      secondCardId: secondCard?.cardId ?? null,
      secondCardNumber: secondCard?.cardNumber ?? null,
      receiverOtpVerificationToken: isPickupOtpRequired ? dialog.otp.verificationToken : undefined,
      receiverOtpTarget: isPickupOtpRequired ? 'main' : undefined,
    }).unwrap();

    toast.success('Parcel marked as DELIVERED_BY_OFFICE');
    dialog.closeParcelDialog();
    await listQuery.refetch();
  };

  return {
    context: {
      companyId,
      branchId,
      cashierLocationName,
      isPickupQueueEnabled,
      isPickupOtpRequired,
    },
    table: {
      query,
      setQuery,
      searchInput,
      setSearchInput,
      rows: listQuery.data?.data ?? [],
      listQuery,
      handleSearchSubmit,
      handleRequestDelivery,
      openParcelDialog: dialog.openParcelDialog,
      openEditDialog: (parcel: ParcelSearchRow) => {
        edit.openEditDialog(parcel, () => listQuery.refetch());
      },
      isSaving,
    },
    dialog: {
      ...dialog,
      staffOptions,
      cardOptions,
      parcelDetails,
      mainReceiverCards,
      secondReceiverCards,
      hasPickupQueue: Boolean(parcelDetails?.pickupQueue),
      isSaving,
      isLoading:
        Boolean(selectedParcel) &&
        !dialogLoadState.hasError &&
        (dialogLoadState.isLoading || initializedParcelId !== selectedParcel?.id),
      hasLoadError: dialogLoadState.hasError,
      handleConfirmDelivered,
      handleRequestHomeDelivery: async () => {
        if (selectedParcel) await handleRequestDelivery(selectedParcel);
      },
    },
    edit: {
      ...edit,
      setEditingParcel: edit.setEditingParcel,
      setEditParcelDetails: edit.setEditParcelDetails,
      setEditReceiverName: edit.setEditReceiverName,
      setEditReceiverPhone: edit.setEditReceiverPhone,
    },
  };
}
