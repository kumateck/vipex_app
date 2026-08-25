import { StyleSheet, Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { AppButton, AppCard } from '@mobile/components/ui';
import { router } from '@mobile/navigation/router-compat';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { mobileSpacing, mobileTextStyles } from '@mobile/theme/layout';

export function RiderQuickActions({ date }: { date: string }) {
  const { theme } = useAppearance();
  return (
    <AppCard>
      <View style={styles.heading}>
        <Ionicons name="flash-outline" size={20} color={theme.colors.primary} />
        <Text style={[styles.title, { color: theme.colors.text }]}>Quick actions</Text>
      </View>
      <Text style={[styles.body, { color: theme.colors.textMuted }]}>
        Continue today&apos;s delivery work or open the full daily operations view.
      </Text>
      <View style={styles.actions}>
        <AppButton
          title="View Assigned Deliveries"
          onPress={() => router.push({ pathname: '/(app)/rider-assigned', params: { date } })}
        />
        <AppButton
          title="Open Rider Operations"
          variant="tinted"
          onPress={() => router.push('/(app)/rider' as never)}
        />
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  heading: { flexDirection: 'row', alignItems: 'center', gap: mobileSpacing.sm },
  title: { ...mobileTextStyles.headline },
  body: { ...mobileTextStyles.footnote },
  actions: { gap: mobileSpacing.sm },
});
