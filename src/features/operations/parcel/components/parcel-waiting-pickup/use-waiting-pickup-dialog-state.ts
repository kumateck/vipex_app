import { useState } from 'react';
import type { ParcelSearchRow } from '../../api/parcel.api';
import { usePickupOtpVerification } from './use-pickup-otp-verification';
import type { CardMode, HandoverTarget } from './waiting-pickup-types';

type PhoneSlot = 'primary' | 'secondary';

export function useWaitingPickupDialogState() {
  const [selectedParcel, setSelectedParcel] = useState<ParcelSearchRow | null>(null);
  const [handoverTarget, setHandoverTargetState] = useState<HandoverTarget>('main');
  const [pickerStaffId, setPickerStaffId] = useState('');
  const [mainCardMode, setMainCardMode] = useState<CardMode>('none');
  const [mainExistingCardRecordId, setMainExistingCardRecordId] = useState('');
  const [mainNewCardTypeId, setMainNewCardTypeId] = useState('');
  const [mainNewCardNumber, setMainNewCardNumber] = useState('');
  const [secondCardMode, setSecondCardMode] = useState<CardMode>('none');
  const [secondExistingCardRecordId, setSecondExistingCardRecordId] = useState('');
  const [secondNewCardTypeId, setSecondNewCardTypeId] = useState('');
  const [secondNewCardNumber, setSecondNewCardNumber] = useState('');
  const [secondNewName, setSecondNewName] = useState('');
  const [secondNewPhone, setSecondNewPhone] = useState('');
  // Which of the main receiver's two phone numbers ("Phone" vs "Phone 2" on
  // their customer record) the collection OTP should be texted to — lets
  // staff switch numbers if the first one is unreachable. Defaults to the
  // primary number; only shown/used when a second number exists.
  const [phoneSlot, setPhoneSlotState] = useState<PhoneSlot>('primary');
  // OTP verification always targets the main receiver's phone — it confirms the
  // customer's identity/presence and is unrelated to "Who Collected Parcel"
  // (that field only records who physically took the parcel, e.g. a second
  // receiver). Passing handoverTarget here previously made the OTP try to
  // text a second receiver who may not have a saved phone yet, breaking
  // delivery of the OTP entirely.
  const otp = usePickupOtpVerification({
    parcelId: selectedParcel?.id ?? null,
    targetReceiver: 'main',
    phoneSlot,
  });

  const openParcelDialog = (parcel: ParcelSearchRow) => {
    otp.reset();
    setSelectedParcel(parcel);
    setHandoverTargetState(parcel.secondReceiverId ? 'second' : 'main');
    setPickerStaffId('');
    setMainCardMode('none');
    setMainExistingCardRecordId('');
    setMainNewCardTypeId('');
    setMainNewCardNumber('');
    setSecondCardMode('none');
    setSecondExistingCardRecordId('');
    setSecondNewCardTypeId('');
    setSecondNewCardNumber('');
    setSecondNewName('');
    setSecondNewPhone('');
    setPhoneSlotState('primary');
  };

  const closeParcelDialog = () => {
    otp.reset();
    setSelectedParcel(null);
  };

  const setHandoverTarget = (target: HandoverTarget) => {
    otp.reset();
    setHandoverTargetState(target);
  };

  const setPhoneSlot = (slot: PhoneSlot) => {
    otp.reset();
    setPhoneSlotState(slot);
  };

  return {
    selectedParcel,
    openParcelDialog,
    closeParcelDialog,
    handoverTarget,
    setHandoverTarget,
    phoneSlot,
    setPhoneSlot,
    pickerStaffId,
    setPickerStaffId,
    mainCardMode,
    setMainCardMode,
    mainExistingCardRecordId,
    setMainExistingCardRecordId,
    mainNewCardTypeId,
    setMainNewCardTypeId,
    mainNewCardNumber,
    setMainNewCardNumber,
    secondCardMode,
    setSecondCardMode,
    secondExistingCardRecordId,
    setSecondExistingCardRecordId,
    secondNewCardTypeId,
    setSecondNewCardTypeId,
    secondNewCardNumber,
    setSecondNewCardNumber,
    secondNewName,
    setSecondNewName,
    secondNewPhone,
    setSecondNewPhone,
    otp,
  };
}
