import { useState } from 'react';
import { getMobileErrorMessage } from '@mobile/lib/mobile-error-message';
import { notifyError } from '@mobile/lib/notify';
import { useAuth } from '@mobile/providers/auth-provider';
import { logParcelSticker, printParcelSticker, type MobileSticker } from '../services';

export function useMobileStickerPrint() {
  const { withAuth } = useAuth();
  const [pendingSticker, setPendingSticker] = useState<MobileSticker | null>(null);
  const [pendingLog, setPendingLog] = useState<MobileSticker | null>(null);
  const recordPrint = async (sticker: MobileSticker) => {
    try {
      await withAuth((token) => logParcelSticker(token, sticker));
      setPendingLog(null);
      return true;
    } catch (error) {
      setPendingLog(sticker);
      notifyError(
        'Sticker printed; usage not logged',
        getMobileErrorMessage(error, '') || 'Retry the print log without printing again.',
      );
      return false;
    }
  };
  const print = async (sticker: MobileSticker) => {
    setPendingSticker(sticker);
    try {
      await printParcelSticker(sticker);
      setPendingSticker(null);
      return recordPrint(sticker);
    } catch (error) {
      notifyError(
        'Booking saved; sticker not printed',
        getMobileErrorMessage(error, '') || 'Choose Print Sticker to retry.',
      );
      return false;
    }
  };
  return {
    pendingSticker,
    pendingLog,
    print,
    retry: () => (pendingSticker ? print(pendingSticker) : Promise.resolve()),
    retryLog: () => (pendingLog ? recordPrint(pendingLog) : Promise.resolve()),
  };
}
