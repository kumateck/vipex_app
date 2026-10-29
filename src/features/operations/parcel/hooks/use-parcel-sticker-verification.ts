import { useCallback, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { toast } from 'sonner';
import {
  assertVerifiedStickerPayment,
  withVerifiedStickerPayment,
  type VerifiedStickerPayment,
} from '@/shared/printing';
import { getErrorMessage } from '@/lib/TheAduseiErrorResponse';
import { useLazyVerifyStickerPaymentQuery } from '../services';
import { loadStickerPaymentForPrint } from '../utils';

export function useParcelStickerVerification(
  bookingCode: string,
  trackingCode: string,
  confirmedPayment?: VerifiedStickerPayment,
) {
  const [load] = useLazyVerifyStickerPaymentQuery();
  const [payment, setPayment] = useState<VerifiedStickerPayment | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const inFlight = useRef(false);
  const activeParcel = useRef({ bookingCode, trackingCode });
  activeParcel.current = { bookingCode, trackingCode };
  const verify = useCallback(async () => {
    if (inFlight.current) return false;
    inFlight.current = true;
    setIsVerifying(true);
    // Reprints fetch current state; the just-completed cashier action is already confirmed.
    setPayment(null);
    try {
      await withVerifiedStickerPayment(
        { bookingCode, trackingCode },
        () =>
          loadStickerPaymentForPrint({ bookingCode, trackingCode }, confirmedPayment, () =>
            load({ bookingCode, trackingCode }, false).unwrap(),
          ),
        (current) => {
          assertVerifiedStickerPayment(current, activeParcel.current);
          // Print helpers clone the DOM immediately after this promise resolves.
          flushSync(() => setPayment(current));
        },
      );
      return true;
    } catch (error) {
      flushSync(() => setPayment(null));
      toast.error(
        getErrorMessage(error, '') || 'Payment could not be verified; sticker not printed',
      );
      return false;
    } finally {
      inFlight.current = false;
      setIsVerifying(false);
    }
  }, [bookingCode, trackingCode, load, confirmedPayment]);
  const current =
    payment?.bookingCode === bookingCode && payment.trackingCode === trackingCode ? payment : null;
  return { payment: current, verify, isVerifying };
}
