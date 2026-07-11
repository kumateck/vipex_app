import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  DrawerContentScrollView,
  DrawerItem,
  type DrawerContentComponentProps,
} from '@react-navigation/drawer';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@mobile/providers/auth-provider';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { mobileRadius, mobileShadow, mobileSpacing, mobileTextStyles } from '@mobile/theme/layout';

export function MobileDrawerContent(props: DrawerContentComponentProps) {
  const { theme } = useAppearance();
  const { session, logout } = useAuth();
  const insets = useSafeAreaInsets();
  const user = session.user;
  const companyName = user?.company?.name || '-';
  const branchName = user?.branch?.name || 'No branch';
  const locationName = user?.location?.name || user?.branch?.location || 'No location';
  const initials =
    (user?.fullname || user?.email || 'U')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('') || 'U';

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.bgElevated }]}>
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + mobileSpacing.sm },
        ]}
        style={{ backgroundColor: theme.colors.bgElevated }}
      >
        <View
          style={[
            styles.profileCard,
            mobileShadow.card,
            {
              backgroundColor: theme.colors.card,
              borderColor: theme.scheme === 'dark' ? theme.colors.border : 'transparent',
              borderWidth: theme.scheme === 'dark' ? StyleSheet.hairlineWidth : 0,
            },
          ]}
        >
          <View style={styles.profileRow}>
            <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
              <Text style={[styles.avatarText, { color: theme.colors.primaryText }]}>
                {initials}
              </Text>
            </View>
            <View style={styles.identityCol}>
              <Text style={[styles.name, { color: theme.colors.text }]}>
                {user?.fullname || 'Vipex User'}
              </Text>
              <Text numberOfLines={1} style={[styles.email, { color: theme.colors.textSubtle }]}>
                {user?.email || '-'}
              </Text>
            </View>
          </View>
          <View style={styles.metaRow}>
            <View style={[styles.statusDot, { backgroundColor: theme.colors.success }]} />
            <Text style={[styles.metaText, { color: theme.colors.textMuted }]}>
              {companyName} • {branchName} • {locationName}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textSubtle }]}>Menu</Text>
          <DrawerItem
            label="Profile"
            labelStyle={{ color: theme.colors.text, fontWeight: '600' }}
            icon={({ size, color }) => <Ionicons name="person-outline" size={size} color={color} />}
            onPress={() => router.push('/profile')}
            inactiveTintColor={theme.colors.text}
          />
          <DrawerItem
            label="Change Password"
            labelStyle={{ color: theme.colors.text, fontWeight: '600' }}
            icon={({ size, color }) => <Ionicons name="key-outline" size={size} color={color} />}
            onPress={() => router.push('/(app)/change-password' as never)}
            inactiveTintColor={theme.colors.text}
          />
          <DrawerItem
            label="Super Search"
            labelStyle={{ color: theme.colors.text, fontWeight: '600' }}
            icon={({ size, color }) => <Ionicons name="search-outline" size={size} color={color} />}
            onPress={() => router.push('/(app)/super-search' as never)}
            inactiveTintColor={theme.colors.text}
          />
          <DrawerItem
            label="Channels"
            labelStyle={{ color: theme.colors.text, fontWeight: '600' }}
            icon={({ size, color }) => (
              <Ionicons name="chatbubbles-outline" size={size} color={color} />
            )}
            onPress={() => router.push('/(app)/(tabs)/chat' as never)}
            inactiveTintColor={theme.colors.text}
          />
        </View>
      </DrawerContentScrollView>

      <View
        style={[
          styles.footer,
          { borderTopColor: theme.colors.border, paddingBottom: insets.bottom },
        ]}
      >
        <DrawerItem
          label="Logout"
          labelStyle={{ color: theme.colors.danger, fontWeight: '700' }}
          icon={({ size }) => (
            <Ionicons name="log-out-outline" size={size} color={theme.colors.danger} />
          )}
          onPress={() => void logout()}
          inactiveTintColor={theme.colors.danger}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scrollContent: { paddingTop: mobileSpacing.sm },
  profileCard: {
    borderRadius: mobileRadius.lg,
    padding: mobileSpacing.md,
    marginHorizontal: mobileSpacing.md,
    marginBottom: mobileSpacing.md,
    gap: mobileSpacing.sm,
  },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: mobileSpacing.sm + 2 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontWeight: '700', fontSize: 15 },
  identityCol: { flex: 1, gap: 1 },
  name: { ...mobileTextStyles.headline },
  email: { ...mobileTextStyles.caption1 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 999 },
  metaText: { ...mobileTextStyles.caption1, fontWeight: '500' },
  section: { marginTop: 2 },
  sectionTitle: {
    ...mobileTextStyles.caption1,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    paddingHorizontal: mobileSpacing.md + 4,
    marginBottom: 4,
  },
  footer: { borderTopWidth: StyleSheet.hairlineWidth, paddingVertical: mobileSpacing.xs },
});
