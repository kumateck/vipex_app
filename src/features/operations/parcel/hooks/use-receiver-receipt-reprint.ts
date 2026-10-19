import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/TheAduseiErrorResponse';
import type { ParcelSearchRow } from '../api/parcel.api';
import { useLazyGetReceiverReceiptReprintQuery } from '../services';
import { buildReceiverReceiptData } from '../utils';
import type { ReceiptPrintData } from '../components/parcel-receipt.types';

export function useReceiverReceiptReprint() {
  const [loadReceipt, { isFetching }] = useLazyGetReceiverReceiptReprintQuery();
  const [printData, setPrintData] = useState<ReceiptPrintData | null>(null);
  const print = useCallback(
    async (parcel: ParcelSearchRow) => {
      try {
        const recorded = await loadReceipt(parcel.id).unwrap();
        const receipt = buildReceiverReceiptData({
          parcel,
          receivedByName: recorded.receivedByName ?? '-',
          destinationBranchName: parcel.destinationName ?? '-',
          destinationLocationName: parcel.pickupLocationName ?? '-',
          totalChargeCedis: parcel.chargePsw / 100,
          senderPaidCedis: recorded.senderPaidPsw / 100,
          receiverPaidCedis: recorded.receiverPrincipalPsw / 100,
          storageChargeCedis: recorded.storageChargePsw / 100,
          taxBreakdown: {
            vatCedis: recorded.vatPsw / 100,
            getfundCedis: recorded.getfundPsw / 100,
            nhilCedis: recorded.nhilPsw / 100,
            covidCedis: recorded.covidPsw / 100,
            taxTotalCedis: recorded.taxTotalPsw / 100,
            taxComponentKeys: recorded.taxComponentKeys,
          },
        });
        setPrintData({ ...receipt, issuedAt: recorded.issuedAt });
      } catch (error) {
        toast.error(
          getErrorMessage(error, '') || 'Could not load receiver receipt; reprint cancelled',
        );
      }
    },
    [loadReceipt],
  );
  const clear = useCallback(() => setPrintData(null), []);
  return { printData, print, clear, isLoading: isFetching };
}
