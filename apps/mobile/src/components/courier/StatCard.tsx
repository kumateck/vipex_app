import { StyleSheet, Text, View } from 'react-native';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { mobileRadius, mobileShadow, mobileSpacing, mobileTextStyles } from '@mobile/theme/layout';

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
        mobileShadow.card,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.scheme === 'dark' ? theme.colors.border : 'transparent',
          borderWidth: theme.scheme === 'dark' ? StyleSheet.hairlineWidth : 0,
        },
      ]}
    >
      <Text style={[styles.value, { color: theme.colors.secondary }]}>{value}</Text>
      <Text style={[styles.label, { color: theme.colors.textMuted }]}>{label}</Text>
      {hint ? <Text style={[styles.hint, { color: theme.colors.textSubtle }]}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: mobileRadius.lg,
    padding: mobileSpacing.lg,
    gap: mobileSpacing.xs,
    flex: 1,
    minWidth: 150,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    ...mobileTextStyles.caption1,
    fontWeight: '700',
  },
  value: {
    ...mobileTextStyles.title1,
    fontWeight: '700',
  },
  hint: {
    ...mobileTextStyles.caption1,
  },
});
