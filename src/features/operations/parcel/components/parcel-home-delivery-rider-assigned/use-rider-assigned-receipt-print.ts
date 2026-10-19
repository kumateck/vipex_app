import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { getErrorMessage as getApplicationErrorMessage } from '@/lib/TheAduseiErrorResponse';
import { type HomeDeliveryReceipt, useLazyGetHomeDeliveryReceiptQuery } from '../../api/parcel.api';

export function useRiderAssignedReceiptPrint() {
  const [printData, setPrintData] = useState<HomeDeliveryReceipt | null>(null);
  const [loadReceipt, { isFetching }] = useLazyGetHomeDeliveryReceiptQuery();
  const onPrint = useCallback(
    async (parcelId: string) => {
      try {
        setPrintData(await loadReceipt(parcelId).unwrap());
      } catch (error) {
        toast.error(
          getApplicationErrorMessage(error, '') || 'Failed to load home delivery receipt',
        );
      }
    },
    [loadReceipt],
  );
  const onComplete = useCallback(() => setPrintData(null), []);
  return { printData, isPrinting: isFetching || printData !== null, onPrint, onComplete };
}
