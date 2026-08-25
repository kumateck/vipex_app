import { StyleSheet, Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAuth } from '@mobile/providers/auth-provider';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { mobileRadius, mobileSpacing, mobileTextStyles } from '@mobile/theme/layout';
import { formatDashboardDate } from '../../utils';
import { DashboardMenuButton } from '../dashboard-screen';

function firstName(fullname?: string | null): string {
  return fullname?.trim().split(/\s+/)[0] || 'Cashier';
}

export function CashierDashboardHeader() {
  const { session } = useAuth();
  const { theme } = useAppearance();
  const user = session.user;

  return (
    <View style={styles.header}>
      <View style={styles.topRow}>
        <View style={styles.copy}>
          <Text style={[styles.eyebrow, { color: theme.colors.primary }]}>CASHIER WORKSPACE</Text>
          <Text numberOfLines={1} style={[styles.title, { color: theme.colors.text }]}>
            Hello, {firstName(user?.fullname)}
          </Text>
          <Text style={[styles.date, { color: theme.colors.textMuted }]}>
            {formatDashboardDate()} · Live overview
          </Text>
        </View>
        <DashboardMenuButton />
      </View>

      <View style={styles.chips}>
        <View style={[styles.chip, { backgroundColor: theme.colors.card }]}>
          <Ionicons name="location-outline" size={14} color={theme.colors.primary} />
          <Text numberOfLines={1} style={[styles.chipText, { color: theme.colors.text }]}>
            {user?.branch?.name ?? 'Branch'}
          </Text>
        </View>
        <View style={[styles.chip, { backgroundColor: `${theme.colors.secondary}18` }]}>
          <View style={[styles.onlineDot, { backgroundColor: theme.colors.indicatorOnline }]} />
          <Text numberOfLines={1} style={[styles.chipText, { color: theme.colors.secondary }]}>
            {user?.role?.name ?? 'Cashier'}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { gap: mobileSpacing.md, paddingTop: mobileSpacing.xs },
  topRow: { flexDirection: 'row', alignItems: 'flex-start' },
  copy: { flex: 1, minWidth: 0, gap: 2 },
  eyebrow: { ...mobileTextStyles.eyebrow },
  title: { ...mobileTextStyles.largeTitle },
  date: { ...mobileTextStyles.subhead },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: mobileSpacing.sm },
  chip: {
    maxWidth: '100%',
    minHeight: 30,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: mobileRadius.pill,
    paddingHorizontal: mobileSpacing.md,
    paddingVertical: 6,
  },
  chipText: { ...mobileTextStyles.caption1, fontWeight: '600', flexShrink: 1 },
  onlineDot: { width: 7, height: 7, borderRadius: 4 },
});
