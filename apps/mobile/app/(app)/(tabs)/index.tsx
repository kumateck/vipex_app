import { router } from 'expo-router';
import { StyleSheet, Text } from 'react-native';
import { AppScreen } from '@mobile/components/screen';
import { AppButton, AppCard, AppPageHeader } from '@mobile/components/ui';
import { useAuth } from '@mobile/providers/auth-provider';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { canViewRiderScreen } from '@mobile/lib/permissions';
import { mobileTypography } from '@mobile/theme/layout';
import { UserType } from '@mobile/constants/user-types';

export default function MobileHomeTabScreen() {
  const { theme } = useAppearance();
  const { session } = useAuth();

  const user = session.user;
  const userTypeRaw = user?.userType;
  const normalizedUserType =
    typeof userTypeRaw === 'number'
      ? userTypeRaw
      : typeof userTypeRaw === 'string'
        ? Number.parseInt(userTypeRaw, 10)
        : null;
  const roleName = user?.role?.name?.toLowerCase() ?? '';
  const isRider =
    normalizedUserType === UserType.RIDER ||
    roleName.includes('rider') ||
    canViewRiderScreen(user?.permissions ?? []);

  if (isRider) {
    return (
      <AppScreen>
        <AppPageHeader title="Dashboard" subtitle={`Today • ${new Date().toLocaleDateString()}`} />

        <AppCard>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Super Search Workspace
          </Text>
          <Text style={{ color: theme.colors.textSubtle }}>
            Search parcels quickly and open full parcel details.
          </Text>
          <AppButton
            title="Open Super Search"
            onPress={() => router.push('/super-search' as never)}
          />
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
      <AppPageHeader
        title="Home Dashboard"
        subtitle={`Welcome back, ${user?.fullname ?? user?.email ?? 'User'}`}
      />

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
  sectionTitle: { fontSize: mobileTypography.sectionTitle, fontWeight: '700' },
});
