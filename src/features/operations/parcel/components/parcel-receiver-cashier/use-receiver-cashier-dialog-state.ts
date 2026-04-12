import { useState } from 'react';
import { PaymentMethod } from '@/db/schemas/enums';
import type { ParcelSearchRow } from '../../api/parcel.api';
import type { ReceiptPrintData } from '../parcel-receipt-actions';
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

  const [mainCardMode, setMainCardMode] = useState<CardMode>('existing');
  const [mainExistingCardRecordId, setMainExistingCardRecordId] = useState('');
  const [mainNewCardTypeId, setMainNewCardTypeId] = useState('');
  const [mainNewCardNumber, setMainNewCardNumber] = useState('');

  const [secondCardMode, setSecondCardMode] = useState<CardMode>('new');
  const [secondExistingCardRecordId, setSecondExistingCardRecordId] = useState('');
  const [secondNewCardTypeId, setSecondNewCardTypeId] = useState('');
  const [secondNewCardNumber, setSecondNewCardNumber] = useState('');
  const [secondNewName, setSecondNewName] = useState('');
  const [secondNewPhone, setSecondNewPhone] = useState('');

  const openParcelDialog = (parcel: ParcelSearchRow) => {
    setSelectedParcel(parcel);
    setHandoverTarget(parcel.secondReceiverId ? 'second' : 'main');
    setPickerStaffId('');
    setPaymentMethod(String(PaymentMethod.CASH));
    setPaymentAmount((parcel.plannedToBePaidPsw / 100).toFixed(2));
    setStoragePaymentAmount('0.00');
    setWaiveStorageAmount('0.00');
    setWaiveStorageReason('');
    setMainCardMode('existing');
    setMainExistingCardRecordId('');
    setMainNewCardTypeId('');
    setMainNewCardNumber('');
    setSecondCardMode('new');
    setSecondExistingCardRecordId('');
    setSecondNewCardTypeId('');
    setSecondNewCardNumber('');
    setSecondNewName('');
    setSecondNewPhone('');
  };

  return {
    selectedParcel,
    setSelectedParcel,
    openParcelDialog,
    handoverTarget,
    setHandoverTarget,
    pickerStaffId,
    setPickerStaffId,
    paymentMethod,
    setPaymentMethod,
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
  };
}
