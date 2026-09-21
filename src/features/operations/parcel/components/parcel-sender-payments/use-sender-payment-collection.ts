import { getErrorMessage as getApplicationErrorMessage } from '@/lib/TheAduseiErrorResponse';
import { useState } from 'react';
import { toast } from 'sonner';
import { PaymentMethod } from '@/db/schemas/enums';
import { useListBranchOptionsQuery } from '@/features/branches/api/branches.api';
import { useGetLocationQuery } from '@/features/locations/api/locations.api';
import { type SenderCashierParcel, useCollectSenderAndProcessMutation } from '../../api/parcel.api';
import type { ReceiptPrintData } from '../parcel-receipt.types';
import { buildSenderReceiptData } from './build-sender-receipt-data';
import { resolveMomoTransactionId, type MtnPaymentFlow } from './sender-payment-method';
import { getSenderDuePsw } from './utils';

type UseSenderPaymentCollectionArgs = {
  companyId: string | null;
  refetch: () => unknown;
};

export function useSenderPaymentCollection({ companyId, refetch }: UseSenderPaymentCollectionArgs) {
  const [selectedParcel, setSelectedParcel] = useState<SenderCashierParcel | null>(null);
  const [lastPrintedReceipt, setLastPrintedReceipt] = useState<ReceiptPrintData | null>(null);
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethodRaw] = useState(String(PaymentMethod.CASH));
  const [mtnPaymentFlow, setMtnPaymentFlow] = useState<MtnPaymentFlow>('automated');
  const [momoTransactionId, setMomoTransactionId] = useState('');
  const { data: branchOptions = [] } = useListBranchOptionsQuery(
    { companyId },
    { skip: !companyId },
  );
  const { data: pickupLocation } = useGetLocationQuery(selectedParcel?.pickupLocationId ?? '', {
    skip: !selectedParcel?.pickupLocationId,
  });
  const [collectSenderAndProcess, { isLoading: isCollecting }] =
    useCollectSenderAndProcessMutation();

  const setPaymentMethod = (method: string) => {
    setPaymentMethodRaw(method);
    setMtnPaymentFlow('automated');
    setMomoTransactionId('');
  };

  const setMtnPaymentFlowAndResetMomo = (flow: MtnPaymentFlow) => {
    setMtnPaymentFlow(flow);
    setMomoTransactionId('');
  };

  const openCollectPayment = (parcel: SenderCashierParcel) => {
    setSelectedParcel(parcel);
    setAmount((getSenderDuePsw(parcel) / 100).toFixed(2));
    setPaymentMethod(String(PaymentMethod.CASH));
  };

  const closeCollectPayment = () => {
    setSelectedParcel(null);
    setMomoTransactionId('');
  };

  const handleCollectPayment = async () => {
    if (!selectedParcel) return;
    const senderDueCedis = getSenderDuePsw(selectedParcel) / 100;
    const amountValue = Number(amount);
    const totalChargeCedis = selectedParcel.chargePsw / 100;
    const receiverToPayCedis = Math.max(totalChargeCedis - senderDueCedis, 0);

    if (senderDueCedis > 0 && (Number.isNaN(amountValue) || amountValue <= 0)) {
      toast.error('Enter a valid payment amount');
      return;
    }
    if (senderDueCedis > 0 && Math.abs(amountValue - senderDueCedis) > 0.00001) {
      toast.error(
        `Sender cashier can only collect GHS ${senderDueCedis.toFixed(2)} for this parcel`,
      );
      return;
    }

    try {
      const result = await collectSenderAndProcess({
        parcelId: selectedParcel.id,
        amountCedis: senderDueCedis > 0 ? amountValue : null,
        method: Number(paymentMethod),
        momoTransactionId:
          senderDueCedis > 0
            ? resolveMomoTransactionId(paymentMethod, mtnPaymentFlow, momoTransactionId)
            : null,
      }).unwrap();
      if (senderDueCedis > 0 && !result.payment) {
        throw new Error('Payment completed without a tax breakdown; receipt was not generated');
      }
      const destinationBranchName =
        branchOptions.find((branch) => branch.id === selectedParcel.destinationId)?.name ??
        selectedParcel.destinationId;
      const destinationLocationName =
        pickupLocation?.name ?? selectedParcel.pickupLocationId ?? '-';

      setLastPrintedReceipt(
        buildSenderReceiptData({
          parcel: selectedParcel,
          senderDueCedis,
          amountValue,
          totalChargeCedis,
          receiverToPayCedis,
          destinationBranchName,
          destinationLocationName,
          taxBreakdown: result.payment?.amounts,
        }),
      );
      toast.success(
        senderDueCedis > 0 ? 'Payment collected successfully' : 'Receipts generated successfully',
      );
      setSelectedParcel(null);
      await refetch();
    } catch (error) {
      toast.error(getApplicationErrorMessage(error, '') || 'Failed to process parcel');
    }
  };

  return {
    selectedParcel,
    openCollectPayment,
    closeCollectPayment,
    amount,
    setAmount,
    paymentMethod,
    setPaymentMethod,
    mtnPaymentFlow,
    setMtnPaymentFlow: setMtnPaymentFlowAndResetMomo,
    momoTransactionId,
    setMomoTransactionId,
    isSubmitting: isCollecting,
    handleCollectPayment,
    pickupLocationName: pickupLocation?.name ?? '',
    lastPrintedReceipt,
    clearLastPrintedReceipt: () => setLastPrintedReceipt(null),
  };
}
