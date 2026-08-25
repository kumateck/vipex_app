import { StyleSheet, Text, View } from 'react-native';
import { AppScreen } from '@mobile/components/screen';
import { AppCard, AppPageHeader } from '@mobile/components/ui';
import { useAuth } from '@mobile/providers/auth-provider';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { mobileSpacing, mobileTextStyles } from '@mobile/theme/layout';
import { DashboardMenuButton } from '../dashboard-screen';

export function StandardDashboard() {
  const { theme } = useAppearance();
  const { session } = useAuth();
  const user = session.user;

  return (
    <AppScreen>
      <AppPageHeader
        title="Dashboard"
        rightSlot={<DashboardMenuButton />}
        subtitle={`Welcome back, ${user?.fullname ?? user?.email ?? 'User'}`}
      />
      <AppCard>
        <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Account</Text>
        {[
          ['Role', user?.role?.name ?? '—'],
          ['Branch', user?.branch?.name ?? '—'],
          ['Email', user?.email ?? '—'],
        ].map(([label, value]) => (
          <View key={label} style={[styles.metaRow, { borderTopColor: theme.colors.separator }]}>
            <Text style={[styles.cardBody, { color: theme.colors.textSubtle }]}>{label}</Text>
            <Text numberOfLines={1} style={[styles.metaValue, { color: theme.colors.text }]}>
              {value}
            </Text>
          </View>
        ))}
      </AppCard>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  cardTitle: { ...mobileTextStyles.headline },
  cardBody: { ...mobileTextStyles.subhead },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: mobileSpacing.md,
    paddingVertical: mobileSpacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  metaValue: { ...mobileTextStyles.subhead, flex: 1, textAlign: 'right', fontWeight: '600' },
});
