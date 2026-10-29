import { useCallback } from 'react';
import { useLazyGetReceiptReprintTaxQuery } from '../services';
import type { ReceiptPrintData } from '../components/parcel-receipt.types';
import { resolveReceiptReprint } from '../utils';

export function useReceiptReprintTax() {
  const [loadTax] = useLazyGetReceiptReprintTaxQuery();

  return useCallback(
    async (parcelId: string, receipt: ReceiptPrintData): Promise<ReceiptPrintData> => {
      return resolveReceiptReprint(receipt, await loadTax(parcelId, false).unwrap());
    },
    [loadTax],
  );
}
