import { StyleSheet, Text, View } from 'react-native';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { mobileSpacing, mobileTextStyles } from '@mobile/theme/layout';

export function CashierReportDetailLine(props: {
  label: string;
  value: string;
  secondary?: string | null;
}) {
  const { theme } = useAppearance();
  return (
    <View style={styles.row}>
      <Text style={[styles.label, { color: theme.colors.textSubtle }]}>{props.label}</Text>
      <View style={styles.valueWrap}>
        <Text selectable style={[styles.value, { color: theme.colors.text }]}>
          {props.value || '—'}
        </Text>
        {props.secondary ? (
          <Text selectable style={[styles.secondary, { color: theme.colors.textMuted }]}>
            {props.secondary}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: mobileSpacing.sm },
  label: { ...mobileTextStyles.caption1, width: 70, paddingTop: 1 },
  valueWrap: { flex: 1, minWidth: 0, gap: 1 },
  value: { ...mobileTextStyles.subhead, fontWeight: '600' },
  secondary: { ...mobileTextStyles.caption1 },
});
