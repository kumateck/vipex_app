import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';
import type { ComponentProps } from 'react';
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

export default function AppTabsLayout() {
  const { theme } = useAppearance();
  const { session } = useAuth();
  const insets = useSafeAreaInsets();
  const permissions = session.user?.permissions ?? [];
  const isRider = session.user?.userType === UserType.RIDER;

  const canUseQueue = canViewQueueScreen(permissions) && !isRider;
  const canUseScan = canViewReceiveScreen(permissions) && !isRider;

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
        name="parcels"
        options={{
          title: 'Parcels',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="cube-outline" color={color} focused={focused} />
          ),
        }}
      />
      {canUseQueue ? (
        <Tabs.Screen
          name="queue"
          options={{
            title: 'Queue',
            tabBarIcon: ({ color, focused }) => (
              <TabIcon name="ticket-outline" color={color} focused={focused} />
            ),
          }}
        />
      ) : null}
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
      {canUseScan ? (
        <Tabs.Screen
          name="scan"
          options={{
            title: 'Scan',
            tabBarIcon: ({ color, focused }) => (
              <TabIcon name="qr-code-outline" color={color} focused={focused} />
            ),
          }}
        />
      ) : null}
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
