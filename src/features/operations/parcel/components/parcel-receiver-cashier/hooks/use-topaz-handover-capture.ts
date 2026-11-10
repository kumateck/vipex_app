import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/TheAduseiErrorResponse';
import {
  type PendingReceiverHandoverRow,
  isReceiverCashierSignature,
} from '@/shared/shipments/receiver-cashier-signature';
import { useCaptureReceiverHandoverMutation } from '../services';

export function useTopazHandoverCapture() {
  const [save] = useCaptureReceiverHandoverMutation();
  const [activeId, setActiveId] = useState<string>();
  const busy = useRef(false);
  const available = typeof window !== 'undefined' && Boolean(window.api?.captureReceiverSignature);
  const capture = async (row: PendingReceiverHandoverRow) => {
    if (busy.current || !window.api?.captureReceiverSignature) return;
    busy.current = true;
    setActiveId(row.id);
    try {
      const captured = await window.api.captureReceiverSignature();
      if (!captured) return;
      const signature = { source: 'topaz' as const, ...captured };
      if (!isReceiverCashierSignature(signature))
        throw new Error('No usable signature. Try signing again.');
      await save({ parcelId: row.id, handoverId: row.handoverId, signature }).unwrap();
      toast.success('Signature saved. The parcel is ready to confirm.');
    } catch (error) {
      toast.error(getErrorMessage(error, '') || 'Could not capture the Topaz signature');
    } finally {
      setActiveId(undefined);
      busy.current = false;
    }
  };
  return { capture, available, activeId };
}
