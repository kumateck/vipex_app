import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { mobileRadius, mobileSpacing, mobileTextStyles } from '@mobile/theme/layout';

export type ParcelDetailTab = 'overview' | 'people' | 'payments' | 'delivery' | 'history';

const TABS: Array<[ParcelDetailTab, string]> = [
  ['overview', 'Overview'],
  ['people', 'People'],
  ['payments', 'Payments'],
  ['delivery', 'Delivery'],
  ['history', 'History'],
];

/** Horizontally scrollable section switcher so one phone screen shows one topic at a time. */
export function ParcelDetailTabs({
  value,
  onChange,
  historyCount,
}: {
  value: ParcelDetailTab;
  onChange: (tab: ParcelDetailTab) => void;
  historyCount: number;
}) {
  const { theme } = useAppearance();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {TABS.map(([tab, label]) => {
        const active = tab === value;
        return (
          <Pressable
            key={tab}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(tab)}
            style={[
              styles.tab,
              { backgroundColor: active ? theme.colors.primary : theme.colors.cardMuted },
            ]}
          >
            <Text
              style={[
                styles.label,
                { color: active ? theme.colors.primaryText : theme.colors.text },
              ]}
            >
              {tab === 'history' && historyCount ? `${label} (${historyCount})` : label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: mobileSpacing.sm, paddingVertical: mobileSpacing.xs },
  tab: {
    borderRadius: mobileRadius.pill,
    paddingHorizontal: mobileSpacing.lg,
    paddingVertical: mobileSpacing.sm,
  },
  label: { ...mobileTextStyles.subhead, fontWeight: '600' },
});
