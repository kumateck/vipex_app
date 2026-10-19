import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/TheAduseiErrorResponse';
import { normalizePhoneDigits } from '@/lib/phone';
import {
  useLazyFindParcelSenderCandidatesQuery,
  useCorrectParcelSenderMutation,
  type BookingCustomer,
} from '../../services';
import type { EditableParcelInformation } from '../types';

export function useParcelSenderCorrection(
  parcel: EditableParcelInformation,
  onCorrected: () => void,
) {
  const [open, setOpen] = useState(false);
  const [telephone, setTelephone] = useState('');
  const [reason, setReason] = useState('');
  const [selected, setSelected] = useState('');
  const [matches, setMatches] = useState<BookingCustomer[] | null>(null);
  const [search, { isFetching }] = useLazyFindParcelSenderCandidatesQuery();
  const [correct, { isLoading: isSaving }] = useCorrectParcelSenderMutation();
  const version = useRef(0);
  const saving = useRef(false);
  const changeTelephone = (value: string) => {
    version.current++;
    setTelephone(normalizePhoneDigits(value));
    setSelected('');
    setMatches(null);
  };
  const lookup = async () => {
    const number = normalizePhoneDigits(telephone);
    if (number.length !== 10) return toast.error('Enter the correct ten-digit sender telephone');
    const current = ++version.current;
    try {
      const rows = await search({ parcelId: parcel.id, telephone: number }).unwrap();
      if (current === version.current) {
        setMatches(rows);
        setSelected('');
      }
    } catch (error) {
      if (current === version.current)
        toast.error(getErrorMessage(error, 'Could not find sender customers'));
    }
  };
  const save = async () => {
    if (!selected || !parcel.senderId || reason.trim().length < 5 || isFetching || saving.current)
      return;
    saving.current = true;
    try {
      const result = await correct({
        parcelId: parcel.id,
        expectedSenderId: parcel.senderId,
        customerId: selected,
        telephone,
        reason: reason.trim(),
      }).unwrap();
      toast.success(
        result.changed
          ? 'Parcel linked to the correct sender'
          : 'This customer is already the sender',
      );
      setOpen(false);
      onCorrected();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not correct the sender'));
    } finally {
      saving.current = false;
    }
  };
  return {
    open,
    begin: () => {
      changeTelephone('');
      setReason('');
      setOpen(true);
    },
    close: () => {
      if (!saving.current) {
        version.current++;
        setOpen(false);
      }
    },
    telephone,
    changeTelephone,
    reason,
    setReason,
    selected,
    setSelected,
    matches,
    isFetching,
    isSaving,
    lookup,
    save,
  };
}
