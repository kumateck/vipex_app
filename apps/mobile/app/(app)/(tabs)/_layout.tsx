import { Tabs, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { ComponentProps } from 'react';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { useAuth } from '@mobile/providers/auth-provider';
import {
  canViewQueueScreen,
  canViewReceiveScreen,
  canViewRiderScreen,
} from '@mobile/lib/permissions';
import { UserType } from '@mobile/constants/user-types';

function DrawerMenuButton() {
  const { theme } = useAppearance();
  const navigation = useNavigation();
  return (
    <Pressable
      onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
      style={{ paddingHorizontal: 12, paddingVertical: 6 }}
      accessibilityRole="button"
      accessibilityLabel="Open side menu"
    >
      <Ionicons name="menu-outline" size={22} color={theme.colors.text} />
    </Pressable>
  );
}

function TabIcon({
  name,
  color,
  focused,
}: {
  name: ComponentProps<typeof Ionicons>['name'];
  color: string;
  focused: boolean;
}) {
  const { theme } = useAppearance();
  return (
    <View
      style={{
        width: 40,
        height: 34,
        borderRadius: 11,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: focused ? theme.colors.primary : theme.colors.cardMuted,
      }}
    >
      <Ionicons name={name} size={18} color={focused ? theme.colors.primaryText : color} />
    </View>
  );
}

function RiderHeaderActions() {
  const { theme } = useAppearance();

  function HeaderAction({
    icon,
    label,
    onPress,
  }: {
    icon: ComponentProps<typeof Ionicons>['name'];
    label: string;
    onPress: () => void;
  }) {
    return (
      <Pressable onPress={onPress} style={styles.headerAction}>
        <Ionicons name={icon} size={16} color={theme.colors.text} />
        <Text style={[styles.headerActionLabel, { color: theme.colors.textSubtle }]}>{label}</Text>
      </Pressable>
    );
  }

  return (
    <View style={styles.headerActionsWrap}>
      <HeaderAction
        icon="list-outline"
        label="Assigned"
        onPress={() => router.push('/(app)/rider-assigned' as never)}
      />
      <HeaderAction
        icon="time-outline"
        label="History"
        onPress={() => router.push('/(app)/rider-history' as never)}
      />
    </View>
  );
}

export default function AppTabsLayout() {
  const { theme } = useAppearance();
  const { session } = useAuth();
  const insets = useSafeAreaInsets();
  const userTypeRaw = session.user?.userType;
  const normalizedUserType =
    typeof userTypeRaw === 'number'
      ? userTypeRaw
      : typeof userTypeRaw === 'string'
        ? Number.parseInt(userTypeRaw, 10)
        : null;
  const roleName = session.user?.role?.name?.toLowerCase() ?? '';
  const permissions = session.user?.permissions ?? [];
  const isStaff = normalizedUserType === UserType.STAFF || roleName.includes('staff');
  const isCashier = normalizedUserType === UserType.CASHIER || roleName.includes('cashier');
  const isRider =
    !isStaff &&
    !isCashier &&
    (normalizedUserType === UserType.RIDER ||
      roleName.includes('rider') ||
      canViewRiderScreen(permissions));

  const canUseQueue = canViewQueueScreen(permissions);
  const canUseScan = canViewReceiveScreen(permissions);

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.bgElevated },
        headerTitleStyle: { color: theme.colors.text, fontWeight: '700' },
        headerTintColor: theme.colors.text,
        sceneStyle: { backgroundColor: theme.colors.bg },
        headerLeft: () => <DrawerMenuButton />,
        tabBarStyle: {
          backgroundColor: theme.colors.bgElevated,
          borderTopColor: theme.colors.border,
          height: 70 + insets.bottom,
          paddingBottom: Math.max(insets.bottom, 6),
          paddingTop: 8,
          paddingHorizontal: 10,
        },
        tabBarItemStyle: {
          paddingHorizontal: 2,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          marginTop: 2,
        },
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSubtle,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="speedometer-outline" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="chatbubbles-outline" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="queue"
        options={
          canUseQueue
            ? {
                title: 'Queue',
                tabBarIcon: ({ color, focused }) => (
                  <TabIcon name="ticket-outline" color={color} focused={focused} />
                ),
              }
            : { href: null }
        }
      />
      <Tabs.Screen
        name="scan"
        options={
          canUseScan
            ? {
                title: 'Scan',
                headerShown: false,
                tabBarIcon: ({ color, focused }) => (
                  <TabIcon name="qr-code-outline" color={color} focused={focused} />
                ),
              }
            : { href: null }
        }
      />
      <Tabs.Screen
        name="parcels"
        options={
          isRider
            ? {
                title: 'Rider',
                headerLeft: () => <DrawerMenuButton />,
                headerRight: () => <RiderHeaderActions />,
                tabBarIcon: ({ color, focused }) => (
                  <TabIcon name="bicycle-outline" color={color} focused={focused} />
                ),
              }
            : { href: null }
        }
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="person-circle-outline" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen name="operations" options={{ href: null }} />
      <Tabs.Screen name="communication" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  headerActionsWrap: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    paddingRight: 8,
  },
  headerAction: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 48,
  },
  headerActionLabel: {
    fontSize: 9,
    fontWeight: '700',
    marginTop: 1,
  },
});
