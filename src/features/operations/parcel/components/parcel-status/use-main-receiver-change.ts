import { useState } from 'react';
import { limitPhoneDigits, normalizePhoneDigits } from '@/lib/phone';
import {
  useChangeCallOutcomeMainReceiverMutation,
  useLookupCallOutcomeReceiverQuery,
} from '../../api/parcel.api';
import type { ContactOutcome } from './types';

export function useMainReceiverChange(open: boolean) {
  const [enabled, setEnabled] = useState(false);
  const [telephone, setTelephone] = useState('');
  const [fullname, setFullname] = useState('');
  const normalizedTelephone = normalizePhoneDigits(telephone);
  const readyToLookup = open && enabled && normalizedTelephone.length === 10;
  const lookup = useLookupCallOutcomeReceiverQuery(normalizedTelephone, { skip: !readyToLookup });
  const [changeReceiver, { isLoading: isSaving }] = useChangeCallOutcomeMainReceiverMutation();

  function reset() {
    setEnabled(false);
    setTelephone('');
    setFullname('');
  }

  function changeTelephone(value: string) {
    setTelephone(limitPhoneDigits(value));
    setFullname('');
  }

  const canSave =
    !enabled ||
    (readyToLookup &&
      !lookup.isFetching &&
      !lookup.isError &&
      (Boolean(lookup.data?.id) || (lookup.data === null && fullname.trim().length > 0)));

  function save(input: { parcelId: string; outcome: ContactOutcome }) {
    return changeReceiver({
      id: input.parcelId,
      outcome: input.outcome,
      telephone: normalizedTelephone,
      ...(!lookup.data?.id ? { fullname: fullname.trim() } : {}),
    }).unwrap();
  }

  return {
    enabled,
    setEnabled,
    telephone,
    changeTelephone,
    fullname,
    setFullname,
    existing: lookup.data ?? null,
    isLookingUp: lookup.isFetching,
    lookupFailed: lookup.isError,
    lookupDone: readyToLookup && lookup.isSuccess,
    retryLookup: () => {
      if (readyToLookup) void lookup.refetch();
    },
    canSave,
    isSaving,
    reset,
    save,
  };
}
