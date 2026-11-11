import { useState } from 'react';
import { useReceiverOtpSession } from '../../hooks';
import { PaymentMethod } from '@/db/schemas/enums';
import type { ParcelSearchRow } from '../../api/parcel.api';
import type { ReceiptPrintData } from '../parcel-receipt.types';
import type { CardMode, HandoverTarget } from './receiver-cashier-types';

export function useReceiverCashierDialogState() {
  const [selectedParcel, setSelectedParcel] = useState<ParcelSearchRow | null>(null);
  const [handoverTarget, setHandoverTarget] = useState<HandoverTarget>('main');
  const [pickerStaffId, setPickerStaffId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<string>(String(PaymentMethod.CASH));
  const [paymentAmount, setPaymentAmount] = useState('');
  const [storagePaymentAmount, setStoragePaymentAmount] = useState('');
  const [waiveStorageReason, setWaiveStorageReason] = useState('');
  const [waiveStorageAmount, setWaiveStorageAmount] = useState('');
  const [lastPrintedReceipt, setLastPrintedReceipt] = useState<ReceiptPrintData | null>(null);

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

  const [momoTransactionId, setMomoTransactionId] = useState('');

  // Which of the main receiver's two phone numbers the collection OTP should
  // be texted to — lets staff switch numbers if the first one is
  // unreachable. Defaults to the primary; only shown/used when a second
  // number exists.
  const [phoneSlot, setPhoneSlotState] = useState<'primary' | 'secondary'>('primary');
  const otp = useReceiverOtpSession({
    parcelId: selectedParcel?.id ?? null,
    targetReceiver: 'main',
    phoneSlot,
    onPhoneSlotRestored: setPhoneSlotState,
  });

  const openParcelDialog = (parcel: ParcelSearchRow) => {
    setSelectedParcel(parcel);
    setHandoverTarget(parcel.secondReceiverId ? 'second' : 'main');
    setPickerStaffId('');
    setPaymentMethod(String(PaymentMethod.CASH));
    setPaymentAmount((parcel.plannedToBePaidPsw / 100).toFixed(2));
    setStoragePaymentAmount('0.00');
    setWaiveStorageAmount('0.00');
    setWaiveStorageReason('');
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
    setMomoTransactionId('');
    setPhoneSlotState('primary');
    void otp.restore(parcel.id);
  };

  const setPhoneSlot = (slot: 'primary' | 'secondary') => {
    setPhoneSlotState(slot);
  };

  const setPaymentMethodAndResetMomo = (method: string) => {
    setPaymentMethod(method);
    setMomoTransactionId('');
  };

  return {
    selectedParcel,
    setSelectedParcel: (next: ParcelSearchRow | null) => {
      if (!next) otp.reset();
      setSelectedParcel(next);
    },
    openParcelDialog,
    handoverTarget,
    setHandoverTarget,
    pickerStaffId,
    setPickerStaffId,
    paymentMethod,
    setPaymentMethod: setPaymentMethodAndResetMomo,
    momoTransactionId,
    setMomoTransactionId,
    paymentAmount,
    setPaymentAmount,
    storagePaymentAmount,
    setStoragePaymentAmount,
    waiveStorageReason,
    setWaiveStorageReason,
    waiveStorageAmount,
    setWaiveStorageAmount,
    lastPrintedReceipt,
    setLastPrintedReceipt,
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
    phoneSlot,
    setPhoneSlot,
    otp,
    otpChannel: otp.otpChannel,
    setOtpChannel: otp.setOtpChannel,
    otpSentAt: otp.otpSentAt,
    otpExpiresAt: otp.otpExpiresAt,
    otpCode: otp.otpCode,
    setOtpCode: otp.setOtpCode,
    otpVerified: otp.otpVerified,
    otpVerificationToken: otp.verificationToken,
    otpRequestPending: otp.otpRequestPending,
    otpVerifyPending: otp.otpVerifyPending,
    otpRestoreError: otp.restoreError,
    otpRestoring: otp.isRestoring,
    retryOtpRestore: otp.retryRestore,
  };
}
