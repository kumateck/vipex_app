import { router } from '@mobile/navigation/router-compat';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { AppScreen } from '@mobile/components/screen';
import { AppButton, AppCard, AppPageHeader } from '@mobile/components/ui';
import { useAuth } from '@mobile/providers/auth-provider';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { canViewRiderScreen } from '@mobile/lib/permissions';
import { mobileRadius, mobileSpacing, mobileTextStyles } from '@mobile/theme/layout';
import { UserType } from '@mobile/constants/user-types';

function CardIcon({
  name,
  tone,
}: {
  name: ComponentProps<typeof Ionicons>['name'];
  tone: 'primary' | 'secondary';
}) {
  const { theme } = useAppearance();
  const color = tone === 'primary' ? theme.colors.primary : theme.colors.secondary;
  return (
    <View style={[styles.cardIcon, { backgroundColor: `${color}1F` }]}>
      <Ionicons name={name} size={18} color={color} />
    </View>
  );
}

function DashboardMenuButton() {
  const { theme } = useAppearance();
  const navigation = useNavigation();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Open menu"
      hitSlop={8}
      onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
      style={({ pressed }) => [styles.menuButton, { opacity: pressed ? 0.6 : 1 }]}
    >
      <Ionicons name="menu-outline" size={24} color={theme.colors.text} />
    </Pressable>
  );
}

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
        <AppPageHeader
          title="Dashboard"
          rightSlot={<DashboardMenuButton />}
          subtitle={`Today · ${new Date().toLocaleDateString(undefined, {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          })}`}
        />

        <AppCard>
          <View style={styles.cardHead}>
            <CardIcon name="search" tone="primary" />
            <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
              Super Search Workspace
            </Text>
          </View>
          <Text style={[styles.cardBody, { color: theme.colors.textMuted }]}>
            Search parcels quickly and open full parcel details.
          </Text>
          <AppButton
            title="Open Super Search"
            onPress={() => router.push('/super-search' as never)}
          />
        </AppCard>

        <AppCard>
          <View style={styles.cardHead}>
            <CardIcon name="chatbubble-ellipses" tone="secondary" />
            <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Communication</Text>
          </View>
          <Text style={[styles.cardBody, { color: theme.colors.textMuted }]}>
            Open chat to view text and voice channels.
          </Text>
          <AppButton
            title="Open Channels"
            onPress={() => router.push('/chat' as never)}
            variant="tinted"
          />
        </AppCard>
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <AppPageHeader
        title="Dashboard"
        rightSlot={<DashboardMenuButton />}
        subtitle={`Welcome back, ${user?.fullname ?? user?.email ?? 'User'}`}
      />

      <AppCard>
        <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Account</Text>
        <View style={styles.metaList}>
          <View style={[styles.metaRow, { borderTopColor: theme.colors.separator }]}>
            <Text style={[styles.metaLabel, { color: theme.colors.textSubtle }]}>Role</Text>
            <Text style={[styles.metaValue, { color: theme.colors.text }]}>
              {user?.role?.name ?? '-'}
            </Text>
          </View>
          <View style={[styles.metaRow, { borderTopColor: theme.colors.separator }]}>
            <Text style={[styles.metaLabel, { color: theme.colors.textSubtle }]}>Branch</Text>
            <Text style={[styles.metaValue, { color: theme.colors.text }]}>
              {user?.branch?.name ?? '-'}
            </Text>
          </View>
          <View style={[styles.metaRow, { borderTopColor: theme.colors.separator }]}>
            <Text style={[styles.metaLabel, { color: theme.colors.textSubtle }]}>Email</Text>
            <Text style={[styles.metaValue, { color: theme.colors.text }]}>
              {user?.email ?? '-'}
            </Text>
          </View>
        </View>
      </AppCard>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: mobileSpacing.sm },
  cardIcon: {
    width: 34,
    height: 34,
    borderRadius: mobileRadius.sm + 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { ...mobileTextStyles.headline },
  cardBody: { ...mobileTextStyles.subhead },
  menuButton: { padding: mobileSpacing.xs },
  metaList: { marginTop: -mobileSpacing.xs },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: mobileSpacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  metaLabel: { ...mobileTextStyles.subhead },
  metaValue: { ...mobileTextStyles.subhead, fontWeight: '600' },
});
