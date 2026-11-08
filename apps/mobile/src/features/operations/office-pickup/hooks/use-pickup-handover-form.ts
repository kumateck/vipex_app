import { useCallback, useState } from 'react';
import type { CardSelection, HandoverTarget, PickupParcel } from '../types';
import { EMPTY_CARD_SELECTION } from '../utils';

/**
 * Form fields of the pickup handover, reset per parcel the same way the web
 * dialog resets them. Changing the collector clears any OTP already sent,
 * via `onOtpInvalidated`.
 */
export function usePickupHandoverForm(onOtpInvalidated: () => void) {
  const [pickerStaffId, setPickerStaffId] = useState('');
  const [handoverTarget, setHandoverTargetState] = useState<HandoverTarget>('main');
  const [mainCard, setMainCard] = useState<CardSelection>(EMPTY_CARD_SELECTION);
  const [secondCard, setSecondCard] = useState<CardSelection>(EMPTY_CARD_SELECTION);
  const [secondNewName, setSecondNewName] = useState('');
  const [secondNewPhone, setSecondNewPhone] = useState('');

  const resetFor = useCallback((parcel: PickupParcel) => {
    setPickerStaffId('');
    setHandoverTargetState(parcel.secondReceiverId ? 'second' : 'main');
    setMainCard(EMPTY_CARD_SELECTION);
    setSecondCard(EMPTY_CARD_SELECTION);
    setSecondNewName('');
    setSecondNewPhone('');
  }, []);

  const setHandoverTarget = useCallback(
    (target: HandoverTarget) => {
      onOtpInvalidated();
      setHandoverTargetState(target);
    },
    [onOtpInvalidated],
  );

  return {
    pickerStaffId,
    setPickerStaffId,
    handoverTarget,
    setHandoverTarget,
    mainCard,
    setMainCard,
    secondCard,
    setSecondCard,
    secondNewName,
    setSecondNewName,
    secondNewPhone,
    setSecondNewPhone,
    resetFor,
  };
}

export type PickupHandoverForm = ReturnType<typeof usePickupHandoverForm>;
