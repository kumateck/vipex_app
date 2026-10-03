import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/TheAduseiErrorResponse';
import { isTenDigitPhone, normalizePhoneDigits, phoneLengthMessage } from '@/lib/phone';
import { canEditSecondReceiver } from '@/shared/shipments/second-receiver';
import { useSetParcelSecondReceiverMutation } from '../api/parcel-second-receiver.api';

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
  const [parcel, setParcel] = useState<SecondReceiverParcel | null>(null);
  const [fullname, setFullname] = useState('');
  const [telephone, setTelephone] = useState('');
  const [setSecondReceiver, { isLoading: isSaving }] = useSetParcelSecondReceiverMutation();

  const open = useCallback((next: SecondReceiverParcel) => {
    setParcel(next);
    setFullname(next.secondReceiverName ?? '');
    setTelephone(normalizePhoneDigits(next.secondReceiverPhone));
  }, []);

  const close = useCallback(() => setParcel(null), []);

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
      toast.success(result.changed ? 'Second receiver saved' : 'Second receiver unchanged');
      setParcel(null);
      onSaved();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to save second receiver'));
    }
  }, [fullname, onSaved, parcel, setSecondReceiver, telephone]);

  return {
    parcel,
    fullname,
    setFullname,
    telephone,
    setTelephone,
    isSaving,
    open,
    close,
    save,
    canEdit: canEditSecondReceiver,
  };
}

export type ParcelSecondReceiverState = ReturnType<typeof useParcelSecondReceiver>;
