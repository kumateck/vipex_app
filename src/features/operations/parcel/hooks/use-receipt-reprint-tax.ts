import { useCallback } from 'react';
import { useLazyGetReceiptReprintTaxQuery } from '../services';
import type { ReceiptPrintData } from '../components/parcel-receipt.types';

export function useReceiptReprintTax() {
  const [loadTax] = useLazyGetReceiptReprintTaxQuery();

  return useCallback(
    async (parcelId: string, receipt: ReceiptPrintData): Promise<ReceiptPrintData> => {
      if (receipt.amountPaidCedis === 0) return receipt;

      const recorded = await loadTax(parcelId).unwrap();
      if (!recorded || recorded.grossAmountPsw <= 0) {
        throw new Error('Recorded sender payment is unavailable; receipt reprint was cancelled');
      }

      const amountPaidCedis = recorded.grossAmountPsw / 100;
      return {
        ...receipt,
        amountPaidCedis,
        senderPaidCedis: amountPaidCedis,
        taxBreakdown: {
          vatCedis: recorded.vatPsw / 100,
          getfundCedis: recorded.getfundPsw / 100,
          nhilCedis: recorded.nhilPsw / 100,
          covidCedis: recorded.covidPsw / 100,
          taxTotalCedis: recorded.taxTotalPsw / 100,
          taxComponentKeys: recorded.taxComponentKeys,
        },
      };
    },
    [loadTax],
  );
}
