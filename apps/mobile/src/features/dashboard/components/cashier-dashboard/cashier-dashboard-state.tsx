import { StyleSheet, Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { AppButton, AppCard, AppSkeletonCard } from '@mobile/components/ui';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { mobileSpacing, mobileTextStyles } from '@mobile/theme/layout';

export function CashierDashboardLoading() {
  return (
    <View style={styles.stack}>
      <AppSkeletonCard lines={4} />
      <AppSkeletonCard lines={3} />
    </View>
  );
}

export function CashierDashboardError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  const { theme } = useAppearance();
  return (
    <View style={[styles.error, { backgroundColor: `${theme.colors.danger}12` }]}>
      <Ionicons name="alert-circle-outline" size={20} color={theme.colors.danger} />
      <View style={styles.errorCopy}>
        <Text style={[styles.errorTitle, { color: theme.colors.text }]}>
          Couldn&apos;t refresh dashboard
        </Text>
        <Text style={[styles.errorBody, { color: theme.colors.textMuted }]}>{message}</Text>
      </View>
      <AppButton title="Retry" onPress={onRetry} variant="plain" />
    </View>
  );
}

export function CashierDashboardAccessNotice() {
  const { theme } = useAppearance();

  return (
    <AppCard>
      <View style={styles.notice}>
        <Ionicons name="lock-closed-outline" size={25} color={theme.colors.warning} />
        <View style={styles.noticeCopy}>
          <Text style={[styles.noticeTitle, { color: theme.colors.text }]}>
            Limited dashboard access
          </Text>
          <Text style={[styles.noticeBody, { color: theme.colors.textMuted }]}>
            Your role does not currently include access to cashier sessions. Ask an administrator to
            update the cashier role permissions.
          </Text>
        </View>
      </View>
    </AppCard>
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
  notice: { flexDirection: 'row', alignItems: 'flex-start', gap: mobileSpacing.md },
  noticeCopy: { flex: 1, minWidth: 0, gap: 3 },
  noticeTitle: { ...mobileTextStyles.headline },
  noticeBody: { ...mobileTextStyles.footnote },
});
