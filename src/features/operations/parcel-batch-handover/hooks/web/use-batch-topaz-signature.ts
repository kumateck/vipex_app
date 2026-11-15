import { useRef, useState } from 'react';
import { getErrorMessage } from '@/lib/TheAduseiErrorResponse';
import {
  isReceiverCashierSignature,
  type ReceiverCashierSignature,
} from '@/shared/shipments/receiver-cashier-signature';

export function useBatchTopazSignature(onCapture: (value: ReceiverCashierSignature) => void) {
  const locked = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const available = typeof window !== 'undefined' && Boolean(window.api?.captureReceiverSignature);

  const capture = async () => {
    if (locked.current || !window.api?.captureReceiverSignature) return;
    locked.current = true;
    setBusy(true);
    setError('');
    try {
      const captured = await window.api.captureReceiverSignature();
      if (!captured) return;
      const signature = { source: 'topaz' as const, ...captured };
      if (!isReceiverCashierSignature(signature))
        throw new Error('No usable signature. Sign again.');
      onCapture(signature);
    } catch (failure) {
      setError(getErrorMessage(failure, 'Could not capture the Topaz signature.'));
    } finally {
      locked.current = false;
      setBusy(false);
    }
  };
  return { available, busy, error, capture };
}
