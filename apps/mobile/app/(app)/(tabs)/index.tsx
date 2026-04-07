import { router } from 'expo-router';
import { StyleSheet, Text } from 'react-native';
import { AppScreen } from '@mobile/components/screen';
import { AppButton, AppCard } from '@mobile/components/ui';
import { useAuth } from '@mobile/providers/auth-provider';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { canViewRiderScreen } from '@mobile/lib/permissions';
import { mobileSpacing, mobileTypography } from '@mobile/theme/layout';
import { UserType } from '@mobile/constants/user-types';

export default function MobileHomeTabScreen() {
  const { theme } = useAppearance();
  const { session } = useAuth();

  const user = session.user;
  const isRider = user?.userType === UserType.RIDER || canViewRiderScreen(user?.permissions ?? []);

  if (isRider) {
    return (
      <AppScreen>
        <Text style={[styles.title, { color: theme.colors.text }]}>Dashboard</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSubtle }]}>
          Rider workspace with daily stats, assigned parcels, and delivery history.
        </Text>

        <AppCard>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Rider Workspace</Text>
          <Text style={{ color: theme.colors.textSubtle }}>
            Open parcels to view assigned items, filter history by date, and complete delivery
            actions.
          </Text>
          <AppButton title="Open Rider Parcels" onPress={() => router.push('/parcels' as never)} />
        </AppCard>

        <AppCard>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Communication</Text>
          <Text style={{ color: theme.colors.textSubtle }}>
            Open chat to view text and voice channels.
          </Text>
          <AppButton
            title="Open Channels"
            onPress={() => router.push('/chat' as never)}
            variant="secondary"
          />
        </AppCard>
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <Text style={[styles.title, { color: theme.colors.text }]}>Dashboard</Text>
      <Text style={[styles.subtitle, { color: theme.colors.textSubtle }]}>
        Welcome back, {user?.fullname ?? user?.email ?? 'User'}
      </Text>

      <AppCard>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Account</Text>
        <Text style={{ color: theme.colors.textSubtle }}>Role: {user?.role?.name ?? '-'}</Text>
        <Text style={{ color: theme.colors.textSubtle }}>Branch: {user?.branch?.name ?? '-'}</Text>
        <Text style={{ color: theme.colors.textSubtle }}>Email: {user?.email ?? '-'}</Text>
      </AppCard>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: mobileTypography.title, fontWeight: '800' },
  subtitle: { marginTop: -2, lineHeight: 20, marginBottom: mobileSpacing.xs },
  sectionTitle: { fontSize: mobileTypography.sectionTitle, fontWeight: '700' },
});
