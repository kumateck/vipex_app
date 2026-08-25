import type { ComponentProps } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { AppCard } from '@mobile/components/ui';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { mobileRadius, mobileSpacing, mobileTextStyles } from '@mobile/theme/layout';

type MetricProps = {
  icon: ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: number;
  color: string;
  bordered?: boolean;
};

function ActivityMetric({ icon, label, value, color, bordered }: MetricProps) {
  const { theme } = useAppearance();
  return (
    <View
      style={[
        styles.metric,
        bordered && {
          borderLeftColor: theme.colors.separator,
          borderLeftWidth: StyleSheet.hairlineWidth,
        },
      ]}
    >
      <View style={[styles.metricIcon, { backgroundColor: `${color}16` }]}>
        <Ionicons name={icon} size={17} color={color} />
      </View>
      <Text style={[styles.value, { color: theme.colors.text }]}>{value}</Text>
      <Text numberOfLines={2} style={[styles.label, { color: theme.colors.textMuted }]}>
        {label}
      </Text>
    </View>
  );
}

export function RiderActivityCard(props: {
  assigned: number;
  completed: number;
  returned: number;
}) {
  const { theme } = useAppearance();
  return (
    <AppCard>
      <View style={styles.titleRow}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Delivery activity</Text>
        <Text style={[styles.period, { color: theme.colors.textSubtle }]}>Today</Text>
      </View>
      <View style={styles.metrics}>
        <ActivityMetric
          icon="cube-outline"
          label="Assigned"
          value={props.assigned}
          color={theme.colors.secondary}
        />
        <ActivityMetric
          icon="checkmark-circle-outline"
          label="Completed"
          value={props.completed}
          color={theme.colors.success}
          bordered
        />
        <ActivityMetric
          icon="return-down-back-outline"
          label="Returned"
          value={props.returned}
          color={theme.colors.warning}
          bordered
        />
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { ...mobileTextStyles.headline },
  period: { ...mobileTextStyles.caption1, fontWeight: '600' },
  metrics: { flexDirection: 'row', marginTop: mobileSpacing.sm },
  metric: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    paddingHorizontal: mobileSpacing.xs,
    borderLeftWidth: 0,
  },
  metricIcon: {
    width: 34,
    height: 34,
    borderRadius: mobileRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: { fontSize: 25, lineHeight: 31, fontWeight: '800', letterSpacing: -0.4, marginTop: 4 },
  label: { ...mobileTextStyles.caption1, textAlign: 'center' },
});
