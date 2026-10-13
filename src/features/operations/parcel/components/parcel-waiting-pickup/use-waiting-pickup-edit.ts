import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { isOptionalTenDigitPhone, normalizePhoneDigits, phoneLengthMessage } from '@/lib/phone';
import { buildParcelInformationEdit } from '@/shared/shipments/parcel-information-edit';
import { useEditParcelInformationMutation } from '../../services';
import type { ParcelSearchRow } from '../../api/parcel.api';

export function useWaitingPickUpEdit() {
  const [editingParcel, setEditingParcel] = useState<ParcelSearchRow | null>(null);
  const [editParcelDetails, setEditParcelDetails] = useState('');
  const [editReceiverName, setEditReceiverName] = useState('');
  const [editReceiverPhone, setEditReceiverPhone] = useState('');
  const [refetchFn, setRefetchFn] = useState<(() => Promise<unknown>) | null>(null);

  const [editInformation, { isLoading: isSaving }] = useEditParcelInformationMutation();

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

    const patch = buildParcelInformationEdit(editingParcel, {
      parcelDetails: nextParcelDetails,
      receiverName: nextReceiverName,
      receiverPhone: nextReceiverPhone,
    });
    if (!patch) {
      toast.message('No changes to save');
      setEditingParcel(null);
      return;
    }

    await editInformation(patch).unwrap();
    toast.success('Parcel updated');
    setEditingParcel(null);
    if (refetchFn) await refetchFn();
  }, [
    editingParcel,
    editParcelDetails,
    editReceiverName,
    editReceiverPhone,
    editInformation,
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
    isSaving,
  };
}
