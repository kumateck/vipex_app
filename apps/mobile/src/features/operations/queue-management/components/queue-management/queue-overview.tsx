import { StyleSheet, Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { mobileRadius, mobileShadow, mobileSpacing, mobileTextStyles } from '@mobile/theme/layout';

function QueueMetric({ icon, label, value }: { icon: string; label: string; value: number }) {
  const { theme } = useAppearance();
  return (
    <View style={[styles.metric, mobileShadow.card, { backgroundColor: theme.colors.card }]}>
      <View style={[styles.icon, { backgroundColor: `${theme.colors.secondary}18` }]}>
        <Ionicons name={icon} size={18} color={theme.colors.secondary} />
      </View>
      <Text style={[styles.value, { color: theme.colors.text }]}>{value}</Text>
      <Text style={[styles.label, { color: theme.colors.textMuted }]} numberOfLines={2}>
        {label}
      </Text>
    </View>
  );
}

export function QueueOverview({
  receiverCount,
  waitingCount,
}: {
  receiverCount: number;
  waitingCount: number;
}) {
  return (
    <View style={styles.row}>
      <QueueMetric icon="people-outline" label="Receiver queue" value={receiverCount} />
      <QueueMetric icon="cube-outline" label="Waiting pickup" value={waitingCount} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: mobileSpacing.sm },
  metric: { flex: 1, borderRadius: mobileRadius.lg, padding: mobileSpacing.md, gap: 6 },
  icon: {
    width: 34,
    height: 34,
    borderRadius: mobileRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: { ...mobileTextStyles.title1, fontWeight: '800' },
  label: { ...mobileTextStyles.caption1, fontWeight: '600' },
});
