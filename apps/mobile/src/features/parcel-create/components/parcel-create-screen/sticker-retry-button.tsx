import { AppButton } from '@mobile/components/ui/mobile';

export function StickerRetryButton({
  bookingCode,
  onRetry,
  action = 'print',
}: {
  bookingCode: string;
  onRetry: () => void;
  action?: 'print' | 'log';
}) {
  return (
    <AppButton
      title={`${action === 'print' ? 'Print Sticker' : 'Retry Print Log'}: ${bookingCode}`}
      onPress={onRetry}
      variant="secondary"
    />
  );
}
