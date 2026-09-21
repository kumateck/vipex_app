import { useEffect, useState } from 'react';
import type { ParcelFullDetails } from '../../api/parcel.api';
import { resolveShelfPickerStaffId } from '../../utils';

type ReceiverCashierInitializationInput = {
  selectedParcelId: string | null;
  parcelDetails: ParcelFullDetails | undefined;
  receiverDuePsw: number;
  storageOutstandingPsw: number;
  isLoading: boolean;
  hasError: boolean;
  setPaymentAmount: (value: string) => void;
  setStoragePaymentAmount: (value: string) => void;
  setWaiveStorageAmount: (value: string) => void;
  setPickerStaffId: (value: string) => void;
};

export function useReceiverCashierInitialization({
  selectedParcelId,
  parcelDetails,
  receiverDuePsw,
  storageOutstandingPsw,
  isLoading,
  hasError,
  setPaymentAmount,
  setStoragePaymentAmount,
  setWaiveStorageAmount,
  setPickerStaffId,
}: ReceiverCashierInitializationInput) {
  const [initializedParcelId, setInitializedParcelId] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedParcelId || !parcelDetails || isLoading || hasError) return;

    setPaymentAmount((receiverDuePsw / 100).toFixed(2));
    setStoragePaymentAmount((storageOutstandingPsw / 100).toFixed(2));
    setWaiveStorageAmount((storageOutstandingPsw / 100).toFixed(2));
    setPickerStaffId(resolveShelfPickerStaffId(parcelDetails));
    setInitializedParcelId(selectedParcelId);
  }, [
    hasError,
    isLoading,
    parcelDetails,
    receiverDuePsw,
    selectedParcelId,
    setPaymentAmount,
    setPickerStaffId,
    setStoragePaymentAmount,
    setWaiveStorageAmount,
    storageOutstandingPsw,
  ]);

  return initializedParcelId === selectedParcelId;
}
