import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/TheAduseiErrorResponse';
import { isTenDigitPhone, normalizePhoneDigits, phoneLengthMessage } from '@/lib/phone';
import { PermissionKeys } from '@/shared/permissions/constants';
import { useAuthStore } from '@/stores/auth-store';
import {
  useRemoveParcelSecondReceiverMutation,
  useSetParcelSecondReceiverMutation,
} from '../api/parcel-second-receiver.api';

export type SecondReceiverParcel = {
  id: string;
  bookingCode: string;
  status: number;
  receiverName: string | null;
  receiverPhone: string | null;
  secondReceiverName?: string | null;
  secondReceiverPhone?: string | null;
};

export function useParcelSecondReceiver(onSaved: () => void) {
  const canManage = useAuthStore((state) =>
    (state.user?.permissions ?? []).includes(PermissionKeys.CanManageParcelSecondReceiver),
  );
  const [parcel, setParcel] = useState<SecondReceiverParcel | null>(null);
  const [fullname, setFullname] = useState('');
  const [telephone, setTelephone] = useState('');
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const [setSecondReceiver, { isLoading: isSetting }] = useSetParcelSecondReceiverMutation();
  const [removeSecondReceiver, { isLoading: isRemoving }] = useRemoveParcelSecondReceiverMutation();

  const open = useCallback((next: SecondReceiverParcel) => {
    setParcel(next);
    setFullname(next.secondReceiverName ?? '');
    setTelephone(normalizePhoneDigits(next.secondReceiverPhone));
    setConfirmingRemove(false);
  }, []);

  const close = useCallback(() => setParcel(null), []);

  const finish = useCallback(
    (message: string) => {
      toast.success(message);
      setParcel(null);
      onSaved();
    },
    [onSaved],
  );

  const save = useCallback(async () => {
    if (!parcel) return;
    const name = fullname.trim();
    const phone = normalizePhoneDigits(telephone);
    if (!name || !phone) {
      toast.error('Second receiver name and telephone are required');
      return;
    }
    if (!isTenDigitPhone(phone)) {
      toast.error(phoneLengthMessage('Second receiver telephone'));
      return;
    }
    if (phone === normalizePhoneDigits(parcel.receiverPhone)) {
      toast.error('Second receiver telephone must differ from the main receiver');
      return;
    }
    try {
      const result = await setSecondReceiver({
        id: parcel.id,
        fullname: name,
        telephone: phone,
      }).unwrap();
      finish(result.changed ? 'Second receiver saved' : 'Second receiver unchanged');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to save second receiver'));
    }
  }, [finish, fullname, parcel, setSecondReceiver, telephone]);

  const remove = useCallback(async () => {
    if (!parcel) return;
    try {
      const result = await removeSecondReceiver({ id: parcel.id }).unwrap();
      finish(result.changed ? 'Second receiver removed' : 'Parcel had no second receiver');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to remove second receiver'));
    }
  }, [finish, parcel, removeSecondReceiver]);

  return {
    canManage,
    parcel,
    fullname,
    setFullname,
    telephone,
    setTelephone,
    confirmingRemove,
    setConfirmingRemove,
    isSaving: isSetting || isRemoving,
    open,
    close,
    save,
    remove,
  };
}

export type ParcelSecondReceiverState = ReturnType<typeof useParcelSecondReceiver>;
