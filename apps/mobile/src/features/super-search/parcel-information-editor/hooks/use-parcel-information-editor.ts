import { useRef, useState } from 'react';
import { useAuth } from '@mobile/providers/auth-provider';
import { getMobileErrorMessage } from '@mobile/lib/mobile-error-message';
import { notifySuccess } from '@mobile/lib/notify';
import { editParcelInformation } from '../services';
import type { ParcelInformationActionProps } from '../types';
import {
  buildSuperSearchInformationEdit,
  getParcelInformationAccess,
  resolveEditableParcel,
} from '../utils';

export function useParcelInformationEditor({
  details,
  row,
  onSaved,
}: ParcelInformationActionProps) {
  const { session, withAuth } = useAuth();
  const parcel = resolveEditableParcel({ details, row });
  const user = {
    branchId: session.user?.branch?.id ?? session.user?.branchId,
    permissions: session.user?.permissions,
  };
  const access = getParcelInformationAccess(parcel, user);
  const pending = useRef(false);
  const [original, setOriginal] = useState(parcel);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [parcelDetails, setParcelDetails] = useState('');
  const [receiverName, setReceiverName] = useState('');
  const canEditReceiver =
    access.canEditReceiver && getParcelInformationAccess(original, user).canEditReceiver;

  function begin() {
    if (!access.canEdit || pending.current) return;
    setOriginal(parcel);
    setParcelDetails(parcel.parcelDetails ?? '');
    setReceiverName(parcel.receiverName ?? '');
    setError('');
    setOpen(true);
  }

  async function save() {
    if (!open || pending.current) return;
    if (!access.canEdit || !getParcelInformationAccess(original, user).canEdit) {
      setError('You no longer have permission to edit this parcel.');
      return;
    }
    pending.current = true;
    setSaving(true);
    setError('');
    try {
      const patch = buildSuperSearchInformationEdit(
        original,
        { parcelDetails, receiverName },
        canEditReceiver,
      );
      if (!patch) {
        setOpen(false);
        return;
      }
      await withAuth((token) => editParcelInformation(token, patch));
      setOpen(false);
      notifySuccess('Parcel details updated.');
      onSaved();
    } catch (failure) {
      setError(getMobileErrorMessage(failure, 'Unable to save parcel details. Try again.'));
    } finally {
      pending.current = false;
      setSaving(false);
    }
  }

  return {
    ...access,
    canEditReceiver,
    receiverAvailable: original.receiverAvailable,
    bookingCode: original.bookingCode,
    open,
    begin,
    close: () => {
      if (!pending.current) setOpen(false);
    },
    saving,
    error,
    parcelDetails,
    setParcelDetails,
    receiverName,
    setReceiverName,
    save,
  };
}
