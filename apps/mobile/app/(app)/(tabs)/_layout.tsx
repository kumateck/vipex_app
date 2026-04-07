import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Pressable } from 'react-native';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { useAuth } from '@mobile/providers/auth-provider';
import { canViewQueueScreen, canViewReceiveScreen } from '@mobile/lib/permissions';
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

export default function AppTabsLayout() {
  const { theme } = useAppearance();
  const { session } = useAuth();
  const insets = useSafeAreaInsets();
  const permissions = session.user?.permissions ?? [];
  const isRider = session.user?.userType === UserType.RIDER;

  const canUseQueue = canViewQueueScreen(permissions) && !isRider;
  const canUseScan = canViewReceiveScreen(permissions) || isRider;

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
          height: 60 + insets.bottom,
          paddingBottom: Math.max(insets.bottom, 6),
          paddingTop: 6,
          paddingHorizontal: 8,
        },
        tabBarItemStyle: {
          paddingHorizontal: 2,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
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
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="speedometer-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="parcels"
        options={{
          title: 'Parcels',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cube-outline" size={size} color={color} />
          ),
        }}
      />
      {canUseQueue ? (
        <Tabs.Screen
          name="queue"
          options={{
            title: 'Queue',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="ticket-outline" size={size} color={color} />
            ),
          }}
        />
      ) : null}
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubbles-outline" size={size} color={color} />
          ),
        }}
      />
      {canUseScan ? (
        <Tabs.Screen
          name="scan"
          options={{
            title: 'Scan',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="qr-code-outline" size={size} color={color} />
            ),
          }}
        />
      ) : null}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-circle-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen name="operations" options={{ href: null }} />
      <Tabs.Screen name="communication" options={{ href: null }} />
    </Tabs>
  );
}
