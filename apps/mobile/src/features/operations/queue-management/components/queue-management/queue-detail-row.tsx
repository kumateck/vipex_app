import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { mobileSpacing, mobileTextStyles } from '@mobile/theme/layout';

export function QueueDetailRow({
  label,
  value,
  first,
}: {
  label: string;
  value: ReactNode;
  first?: boolean;
}) {
  const { theme } = useAppearance();
  const primitive = typeof value === 'string' || typeof value === 'number';
  return (
    <View
      style={[
        styles.row,
        !first && {
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: theme.colors.separator,
        },
      ]}
    >
      <Text style={[styles.label, { color: theme.colors.textSubtle }]}>{label}</Text>
      {primitive ? (
        <Text style={[styles.value, { color: theme.colors.text }]} numberOfLines={2}>
          {value}
        </Text>
      ) : (
        <View style={styles.valueWrap}>{value}</View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: mobileSpacing.sm,
    paddingVertical: mobileSpacing.sm,
  },
  label: { ...mobileTextStyles.subhead, flexShrink: 0 },
  value: { ...mobileTextStyles.subhead, fontWeight: '600', flex: 1, textAlign: 'right' },
  valueWrap: { alignItems: 'flex-end' },
});
