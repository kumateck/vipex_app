import { useState } from 'react';
import { toast } from 'sonner';
import { PaymentMethod } from '@/db/schemas/enums';
import {
  type ParcelFullDetails,
  useCollectSenderAndProcessMutation,
  useLazyGetParcelDetailsQuery,
} from '../../api/parcel.api';
import type { PendingSenderPaymentParcel, ReceiptSummary } from './parcel-form.types';

type UseParcelCreateSenderPaymentArgs = {
  onPaidReceiptsReady: (receipt: ReceiptSummary) => void;
};

export function useParcelCreateSenderPayment({
  onPaidReceiptsReady,
}: UseParcelCreateSenderPaymentArgs) {
  const [pendingReceipt, setPendingReceipt] = useState<ReceiptSummary | null>(null);
  const [pendingParcels, setPendingParcels] = useState<PendingSenderPaymentParcel[]>([]);
  const [paymentMethod, setPaymentMethodRaw] = useState(String(PaymentMethod.CASH));
  const [momoTransactionId, setMomoTransactionId] = useState('');
  const [collectSenderAndProcess, { isLoading }] = useCollectSenderAndProcessMutation();
  const [loadParcelDetails, { isFetching: isLoadingParcels }] = useLazyGetParcelDetailsQuery();

  const setPaymentMethod = (method: string) => {
    setPaymentMethodRaw(method);
    setMomoTransactionId('');
  };

  const openPaymentDialog = async (receipt: ReceiptSummary) => {
    const senderPayParcels = receipt.parcels.filter((parcel) =>
      Boolean(parcel.parcelId && parcel.senderPaidCedis > 0),
    );

    if (senderPayParcels.length === 0) return false;

    try {
      const loadedDetails = await Promise.all(
        senderPayParcels.map((parcel) => loadParcelDetails(parcel.parcelId ?? '').unwrap()),
      );
      const loadedParcels = loadedDetails
        .map((details, index) => buildPendingParcelFromDetails(details, senderPayParcels[index]))
        .filter((parcel): parcel is PendingSenderPaymentParcel => Boolean(parcel));

      if (loadedParcels.length === 0) return false;
      setPendingReceipt({ bookingId: receipt.bookingId, parcels: loadedParcels });
      setPendingParcels(loadedParcels);
      setPaymentMethodRaw(String(PaymentMethod.CASH));
      setMomoTransactionId('');
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load parcel for payment');
      return false;
    }
  };

  const closePaymentDialog = () => {
    if (isLoading) return;
    setPendingReceipt(null);
    setPendingParcels([]);
  };

  const handlePayAndPrint = async () => {
    if (!pendingReceipt || pendingParcels.length === 0) return;

    try {
      const paidParcels = await Promise.all(
        pendingParcels.map(async (parcel) => {
          const result = await collectSenderAndProcess({
            parcelId: parcel.parcelId,
            amountCedis: parcel.senderDueCedis,
            method: Number(paymentMethod),
            momoTransactionId: momoTransactionId || null,
          }).unwrap();

          return {
            ...parcel,
            amountPaidCedis: parcel.senderDueCedis,
            senderPaidCedis: parcel.senderDueCedis,
            taxBreakdown: result.payment?.amounts,
            issuedAt: new Date().toISOString(),
          };
        }),
      );

      onPaidReceiptsReady({ bookingId: pendingReceipt.bookingId, parcels: paidParcels });
      toast.success('Sender payment collected. Printing receipts.');
      setPendingReceipt(null);
      setPendingParcels([]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to collect sender payment');
    }
  };

  return {
    pendingParcels,
    paymentMethod,
    setPaymentMethod,
    momoTransactionId,
    setMomoTransactionId,
    isSubmittingPayment: isLoading || isLoadingParcels,
    closePaymentDialog,
    handlePayAndPrint,
    openPaymentDialog,
  };
}

function buildPendingParcelFromDetails(
  details: ParcelFullDetails,
  fallback?: ReceiptSummary['parcels'][number],
): PendingSenderPaymentParcel | null {
  const senderDueCedis = Math.max(
    (Number(details.parcel.chargePsw ?? 0) - Number(details.parcel.plannedToBePaidPsw ?? 0)) / 100,
    0,
  );

  if (!fallback?.parcelId || senderDueCedis <= 0) return null;

  return {
    ...fallback,
    parcelId: fallback.parcelId,
    bookingCode: details.parcel.bookingCode,
    trackingCode: details.parcel.trackingCode,
    parcelDetails: details.parcel.parcelDetails,
    parcelContent: details.parcel.parcelContent,
    parcelValueCedis: Number(details.parcel.parcelValuePsw ?? 0) / 100,
    totalChargeCedis: Number(details.parcel.chargePsw ?? 0) / 100,
    senderPaidCedis: senderDueCedis,
    receiverToPayCedis: Math.max(Number(details.parcel.plannedToBePaidPsw ?? 0) / 100, 0),
    senderDueCedis,
  };
}
