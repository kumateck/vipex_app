import type { MobileSticker } from '../../services';
import { StickerRetryButton } from './sticker-retry-button';

export function StickerRetryActions({
  pendingSticker,
  pendingLog,
  onRetryPrint,
  onRetryLog,
}: {
  pendingSticker: MobileSticker | null;
  pendingLog: MobileSticker | null;
  onRetryPrint: () => void;
  onRetryLog: () => void;
}) {
  return (
    <>
      {pendingSticker ? (
        <StickerRetryButton bookingCode={pendingSticker.bookingCode} onRetry={onRetryPrint} />
      ) : null}
      {pendingLog ? (
        <StickerRetryButton
          bookingCode={pendingLog.bookingCode}
          onRetry={onRetryLog}
          action="log"
        />
      ) : null}
    </>
  );
}
