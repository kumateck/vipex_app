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
      <Text style={[styles.label, { color: theme.colors.textMuted }]}>Queue Code</Text>
      <Text style={[styles.title, { color: theme.colors.secondary }]}>{card.queueCode}</Text>
      <Text style={[styles.meta, { color: theme.colors.textMuted }]}>
        Number: {card.queueNumber}
      </Text>
      <Text style={[styles.meta, { color: theme.colors.textMuted }]}>
        Booking: {card.bookingCode}
      </Text>
      <Text style={[styles.meta, { color: theme.colors.textMuted }]}>
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
  label: { fontSize: mobileTypography.caption, fontWeight: '700', textTransform: 'uppercase' },
  title: { fontSize: 36, lineHeight: 40, fontWeight: '800' },
  meta: { fontSize: mobileTypography.body, lineHeight: 19 },
  row: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
});
