import { StyleSheet, Text } from 'react-native';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { mobileTextStyles } from '@mobile/theme/layout';

export function StorageFeeBadge({ storageChargePsw }: { storageChargePsw?: number | null }) {
  const { theme } = useAppearance();
  const amountPsw = Number(storageChargePsw ?? 0);
  if (amountPsw <= 0) return null;

  return (
    <Text style={[styles.badge, { color: theme.colors.warning }]}>
      Storage fee · GHS {(amountPsw / 100).toFixed(2)}
    </Text>
  );
}

const styles = StyleSheet.create({
  badge: {
    ...mobileTextStyles.caption1,
    fontWeight: '700',
  },
});
