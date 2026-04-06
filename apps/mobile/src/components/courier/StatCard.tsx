import { StyleSheet, Text, View } from 'react-native';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { mobileRadius, mobileSpacing, mobileTypography } from '@mobile/theme/layout';

type StatCardProps = {
  label: string;
  value: string | number;
  hint?: string;
};

export function StatCard({ label, value, hint }: StatCardProps) {
  const { theme } = useAppearance();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <Text style={[styles.label, { color: theme.colors.textSubtle }]}>{label}</Text>
      <Text style={[styles.value, { color: theme.colors.text }]}>{value}</Text>
      {hint ? <Text style={[styles.hint, { color: theme.colors.textMuted }]}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: mobileRadius.xl,
    padding: mobileSpacing.md,
    gap: mobileSpacing.xs,
    flex: 1,
    minWidth: 150,
  },
  label: {
    fontSize: mobileTypography.caption,
    fontWeight: '700',
  },
  value: {
    fontSize: mobileTypography.kpi,
    fontWeight: '800',
  },
  hint: {
    fontSize: mobileTypography.caption,
    fontWeight: '600',
  },
});
