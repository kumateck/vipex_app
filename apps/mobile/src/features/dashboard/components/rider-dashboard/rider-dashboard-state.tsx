import { StyleSheet, Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { AppButton, AppSkeletonCard } from '@mobile/components/ui';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { mobileSpacing, mobileTextStyles } from '@mobile/theme/layout';

export function RiderDashboardLoading() {
  return (
    <View style={styles.stack}>
      <AppSkeletonCard lines={4} />
      <AppSkeletonCard lines={3} />
      <AppSkeletonCard lines={3} />
    </View>
  );
}

export function RiderDashboardError(props: { message: string; onRetry: () => void }) {
  const { theme } = useAppearance();
  return (
    <View style={[styles.error, { backgroundColor: `${theme.colors.danger}12` }]}>
      <Ionicons name="cloud-offline-outline" size={22} color={theme.colors.danger} />
      <View style={styles.errorCopy}>
        <Text style={[styles.errorTitle, { color: theme.colors.text }]}>Analytics unavailable</Text>
        <Text style={[styles.errorBody, { color: theme.colors.textMuted }]}>{props.message}</Text>
      </View>
      <AppButton title="Retry" variant="plain" onPress={props.onRetry} />
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: mobileSpacing.md },
  error: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: mobileSpacing.sm,
    borderRadius: 14,
    padding: mobileSpacing.md,
  },
  errorCopy: { flex: 1, minWidth: 0 },
  errorTitle: { ...mobileTextStyles.subhead, fontWeight: '700' },
  errorBody: { ...mobileTextStyles.caption1 },
});
