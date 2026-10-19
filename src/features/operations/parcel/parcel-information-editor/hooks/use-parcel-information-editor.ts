import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth-store';
import { getErrorMessage } from '@/lib/TheAduseiErrorResponse';
import { buildParcelInformationEdit } from '@/shared/shipments/parcel-information-edit';
import { useEditParcelInformationMutation } from '../../services';
import type { EditableParcelInformation } from '../types';
import { getParcelInformationEditorAccess } from '../utils';

export function useParcelInformationEditor(parcel: EditableParcelInformation) {
  const user = useAuthStore((state) => state.user);
  const access = getParcelInformationEditorAccess(parcel, {
    branchId: user?.branch?.id,
    permissions: user?.permissions ?? [],
  });
  const saving = useRef(false);
  const [original, setOriginal] = useState(parcel);
  const [open, setOpen] = useState(false);
  const [parcelDetails, setParcelDetails] = useState('');
  const [receiverName, setReceiverName] = useState('');
  const [receiverPhone, setReceiverPhone] = useState('');
  const [edit, { isLoading: isSaving }] = useEditParcelInformationMutation();
  const begin = () => {
    if (!access.canEdit) return;
    setOriginal(parcel);
    setParcelDetails(parcel.parcelDetails ?? '');
    setReceiverName(parcel.receiverName ?? '');
    setReceiverPhone(parcel.receiverPhone ?? '');
    setOpen(true);
  };
  const save = async () => {
    if (!access.canEdit || isSaving || saving.current) return;
    saving.current = true;
    try {
      if (!parcelDetails.trim()) throw new Error('Parcel details is required');
      const patch = buildParcelInformationEdit(original, {
        parcelDetails,
        receiverName,
        receiverPhone,
      });
      if (!patch) {
        toast.message('No changes to save');
        setOpen(false);
        return;
      }
      if (patch.receiver && !access.canEditReceiver)
        throw new Error('Update Customers permission is required to edit receiver details');
      if (patch.receiver?.fullname !== undefined && !patch.receiver.fullname)
        throw new Error('Receiver name is required');
      if (patch.receiver?.telephone && !/^\d{10}$/.test(patch.receiver.telephone))
        throw new Error('Receiver telephone must be exactly 10 digits');
      await edit(patch).unwrap();
      toast.success('Parcel information updated');
      setOpen(false);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to update parcel information'));
    } finally {
      saving.current = false;
    }
  };
  return {
    ...access,
    original,
    open,
    begin,
    close: () => {
      if (!isSaving) setOpen(false);
    },
    isSaving,
    parcelDetails,
    setParcelDetails,
    receiverName,
    setReceiverName,
    receiverPhone,
    setReceiverPhone,
    save,
  };
}
