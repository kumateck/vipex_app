import { useState } from 'react';
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

  const [otpSentAt, setOtpSentAt] = useState<string | null>(null);
  const [otpExpiresAt, setOtpExpiresAt] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpVerificationToken, setOtpVerificationToken] = useState('');
  const [otpRequestPending, setOtpRequestPending] = useState(false);
  const [otpVerifyPending, setOtpVerifyPending] = useState(false);

  const resetOtpState = () => {
    setOtpSentAt(null);
    setOtpExpiresAt(null);
    setOtpCode('');
    setOtpVerified(false);
    setOtpVerificationToken('');
    setOtpRequestPending(false);
    setOtpVerifyPending(false);
  };

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
    resetOtpState();
  };

  const setHandoverTargetAndResetOtp = (target: HandoverTarget) => {
    setHandoverTarget(target);
    resetOtpState();
  };

  const setPaymentMethodAndResetMomo = (method: string) => {
    setPaymentMethod(method);
    setMomoTransactionId('');
  };

  return {
    selectedParcel,
    setSelectedParcel,
    openParcelDialog,
    handoverTarget,
    setHandoverTarget: setHandoverTargetAndResetOtp,
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
    otpSentAt,
    otpExpiresAt,
    otpCode,
    setOtpCode,
    otpVerified,
    otpVerificationToken,
    otpRequestPending,
    otpVerifyPending,
    setOtpSentAt,
    setOtpExpiresAt,
    setOtpVerified,
    setOtpVerificationToken,
    setOtpRequestPending,
    setOtpVerifyPending,
    resetOtpState,
  };
}
