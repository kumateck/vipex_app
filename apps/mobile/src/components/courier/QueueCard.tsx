import { StyleSheet, Text, View } from 'react-native';
import { AppButton, AppCard } from '@mobile/components/ui';
import { useAppearance } from '@mobile/providers/appearance-provider';
import type { PickupQueueCard } from '@mobile/types/parcels';
import { mobileTypography } from '@mobile/theme/layout';

type QueueCardProps = {
  card: PickupQueueCard;
  onCopy?: () => void;
  onShare?: () => void;
};

export function QueueCard({ card, onCopy, onShare }: QueueCardProps) {
  const { theme } = useAppearance();
  return (
    <AppCard>
      <Text style={[styles.title, { color: theme.colors.text }]}>Queue #{card.queueNumber}</Text>
      <Text style={{ color: theme.colors.textMuted }}>Code: {card.queueCode}</Text>
      <Text style={{ color: theme.colors.textMuted }}>Booking: {card.bookingCode}</Text>
      <Text style={{ color: theme.colors.textMuted }}>
        Receiver: {card.receiverName ?? '-'} ({card.receiverPhone ?? '-'})
      </Text>
      <View style={styles.row}>
        {onCopy ? <AppButton title="Copy" onPress={onCopy} variant="secondary" /> : null}
        {onShare ? <AppButton title="Share" onPress={onShare} variant="secondary" /> : null}
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: mobileTypography.sectionTitle, fontWeight: '700' },
  row: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
});
