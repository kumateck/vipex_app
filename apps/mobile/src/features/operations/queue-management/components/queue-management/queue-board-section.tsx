import { StyleSheet, Text, View } from 'react-native';
import { AppSkeletonCard } from '@mobile/components/ui';
import { QueueCard } from '@mobile/components/courier';
import { useAppearance } from '@mobile/providers/appearance-provider';
import type { PickupQueueCard } from '@mobile/types/parcels';
import { mobileSpacing, mobileTextStyles } from '@mobile/theme/layout';
import { QueueEmptyState } from './queue-empty-state';

type Props = {
  title: string;
  subtitle: string;
  emptyMessage: string;
  cards: PickupQueueCard[];
  loading: boolean;
  onCopy: (queueCode: string) => void;
  onShare: (card: PickupQueueCard) => void;
};

export function QueueBoardSection(props: Props) {
  const { theme } = useAppearance();
  return (
    <View style={styles.section}>
      <View style={styles.heading}>
        <View style={styles.headingText}>
          <Text style={[styles.title, { color: theme.colors.text }]}>{props.title}</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSubtle }]}>
            {props.subtitle}
          </Text>
        </View>
        <View style={[styles.count, { backgroundColor: theme.colors.cardMuted }]}>
          <Text style={[styles.countText, { color: theme.colors.text }]}>{props.cards.length}</Text>
        </View>
      </View>
      {props.loading ? (
        <View style={styles.list}>
          <AppSkeletonCard lines={4} />
          <AppSkeletonCard lines={4} />
        </View>
      ) : props.cards.length === 0 ? (
        <QueueEmptyState icon="checkmark-circle-outline" message={props.emptyMessage} />
      ) : (
        <View style={styles.list}>
          {props.cards.map((card) => (
            <QueueCard
              key={card.id}
              card={card}
              onCopy={() => props.onCopy(card.queueCode)}
              onShare={() => props.onShare(card)}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: mobileSpacing.sm },
  heading: { flexDirection: 'row', alignItems: 'center', gap: mobileSpacing.sm },
  headingText: { flex: 1, gap: 1 },
  title: { ...mobileTextStyles.title3 },
  subtitle: { ...mobileTextStyles.caption1 },
  count: {
    minWidth: 32,
    height: 32,
    paddingHorizontal: 8,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: { ...mobileTextStyles.footnote, fontWeight: '800' },
  list: { gap: mobileSpacing.sm + 2 },
});
