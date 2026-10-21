import { Text } from 'react-native';
import { AppButton, AppCard, AppInput, AppLabel } from '@mobile/components/ui/mobile';
import { useAppearance } from '@mobile/providers/appearance-provider';
import type { CompletedSelfServiceBooking } from '../../types';
import { useCompletedBookingSticker } from '../../hooks';

export function SelfServiceCompletedBooking({
  completed,
  onDone,
}: {
  completed: CompletedSelfServiceBooking;
  onDone: () => void;
}) {
  const { theme } = useAppearance();
  const print = useCompletedBookingSticker(completed);
  const muted = { color: theme.colors.textMuted };
  return (
    <AppCard>
      <Text style={{ color: theme.colors.text, fontWeight: '700' }}>Booking completed</Text>
      <Text style={muted}>
        Booking: {completed.result.parcels[0]?.bookingCode ?? completed.result.bookingId}
      </Text>
      <Text style={muted}>Tracking: {completed.result.parcels[0]?.trackingCode ?? '-'}</Text>
      <Text style={muted}>
        Printing checks the saved payment status. Record any required sender payment first, then
        retry for this saved booking.
      </Text>
      <AppLabel>Sticker copies</AppLabel>
      <AppInput value={print.copies} onChangeText={print.setCopies} keyboardType="number-pad" />
      {!print.validCopies ? (
        <Text style={muted}>Enter a positive whole number of copies.</Text>
      ) : null}
      {!print.ready ? (
        <AppButton
          title="Retry destination details"
          variant="secondary"
          loading={print.loadingDestination}
          onPress={print.retryDestination}
        />
      ) : null}
      {print.pendingLog ? (
        <AppButton
          title="Retry Print Log"
          loading={print.printing}
          onPress={() => void print.retryLog()}
        />
      ) : (
        <AppButton
          title="Print Sticker"
          loading={print.printing}
          disabled={!print.validCopies || !print.ready}
          onPress={() => void print.print()}
        />
      )}
      <AppButton
        title="Back to drafts"
        variant="plain"
        disabled={print.printing}
        onPress={onDone}
      />
    </AppCard>
  );
}
