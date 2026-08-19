import { useState } from 'react';
import type { ParcelSearchRow } from '../../api/parcel.api';
import { usePickupOtpVerification } from './use-pickup-otp-verification';
import type { CardMode, HandoverTarget } from './waiting-pickup-types';

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
  const otp = usePickupOtpVerification({
    parcelId: selectedParcel?.id ?? null,
    targetReceiver: handoverTarget,
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
  };

  const closeParcelDialog = () => {
    otp.reset();
    setSelectedParcel(null);
  };

  const setHandoverTarget = (target: HandoverTarget) => {
    otp.reset();
    setHandoverTargetState(target);
  };

  return {
    selectedParcel,
    openParcelDialog,
    closeParcelDialog,
    handoverTarget,
    setHandoverTarget,
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
