import { StyleSheet, Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { AppButton, AppCard } from '@mobile/components/ui';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { mobileRadius, mobileSpacing, mobileTextStyles } from '@mobile/theme/layout';

export function CashierReportLinkCard({ onPress }: { onPress: () => void }) {
  const { theme } = useAppearance();
  return (
    <AppCard>
      <View style={styles.heading}>
        <View style={[styles.icon, { backgroundColor: `${theme.colors.secondary}18` }]}>
          <Ionicons name="document-text-outline" size={23} color={theme.colors.secondary} />
        </View>
        <View style={styles.copy}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Detailed cashier report</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
            Review sender and receiver payments, payment methods, and To Be Paid parcels.
          </Text>
        </View>
      </View>
      <AppButton title="View Detailed Report" variant="tinted" onPress={onPress} />
    </AppCard>
  );
}

const styles = StyleSheet.create({
  heading: { flexDirection: 'row', alignItems: 'center', gap: mobileSpacing.md },
  icon: {
    width: 46,
    height: 46,
    borderRadius: mobileRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1, minWidth: 0, gap: 2 },
  title: { ...mobileTextStyles.headline },
  subtitle: { ...mobileTextStyles.caption1 },
});
