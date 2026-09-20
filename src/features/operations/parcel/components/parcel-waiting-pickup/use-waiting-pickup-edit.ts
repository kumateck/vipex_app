import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { isOptionalTenDigitPhone, normalizePhoneDigits, phoneLengthMessage } from '@/lib/phone';
import { useUpdateCustomerMutation } from '@/features/customers/api';
import type { ParcelSearchRow } from '../../api/parcel.api';
import { useUpdateParcelMutation } from '../../api/parcel.api';

export function useWaitingPickUpEdit() {
  const [editingParcel, setEditingParcel] = useState<ParcelSearchRow | null>(null);
  const [editParcelDetails, setEditParcelDetails] = useState('');
  const [editReceiverName, setEditReceiverName] = useState('');
  const [editReceiverPhone, setEditReceiverPhone] = useState('');
  const [refetchFn, setRefetchFn] = useState<(() => Promise<unknown>) | null>(null);

  const [updateParcel, { isLoading: isUpdatingParcel }] = useUpdateParcelMutation();
  const [updateCustomer, { isLoading: isUpdatingCustomer }] = useUpdateCustomerMutation();

  const openEditDialog = (parcel: ParcelSearchRow, refetch: () => Promise<unknown>) => {
    setEditingParcel(parcel);
    setEditParcelDetails(parcel.parcelDetails ?? '');
    setEditReceiverName(parcel.receiverName ?? '');
    setEditReceiverPhone(parcel.receiverPhone ?? '');
    setRefetchFn(() => refetch);
  };

  const handleSaveEdit = useCallback(async () => {
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
    toast.success('Parcel updated');
    setEditingParcel(null);
    if (refetchFn) await refetchFn();
  }, [
    editingParcel,
    editParcelDetails,
    editReceiverName,
    editReceiverPhone,
    updateParcel,
    updateCustomer,
    refetchFn,
  ]);

  return {
    editingParcel,
    setEditingParcel,
    editParcelDetails,
    setEditParcelDetails,
    editReceiverName,
    setEditReceiverName,
    editReceiverPhone,
    setEditReceiverPhone,
    openEditDialog,
    handleSaveEdit,
    isSaving: isUpdatingParcel || isUpdatingCustomer,
  };
}
