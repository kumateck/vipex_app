import { Tabs, router } from '@mobile/navigation/router-compat';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { ComponentProps } from 'react';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { useAuth } from '@mobile/providers/auth-provider';
import {
  canViewQueueScreen,
  canViewReceiveScreen,
  resolveMobileDashboardKind,
} from '@mobile/lib/permissions';
import { mobileRadius, mobileShadow } from '@mobile/theme/layout';

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
        width: 42,
        height: 32,
        borderRadius: mobileRadius.pill,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: focused ? theme.colors.primary : 'transparent',
      }}
    >
      <Ionicons name={name} size={19} color={focused ? theme.colors.primaryText : color} />
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
  const permissions = session.user?.permissions ?? [];
  const isRider = resolveMobileDashboardKind(session.user?.userType) === 'rider';

  const canUseQueue = canViewQueueScreen(permissions);
  const canUseScan = canViewReceiveScreen(permissions);

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.bgElevated, elevation: 0, shadowOpacity: 0 },
        headerTitleStyle: { color: theme.colors.text, fontWeight: '600', fontSize: 17 },
        headerTintColor: theme.colors.text,
        headerShadowVisible: false,
        sceneStyle: { backgroundColor: theme.colors.bg },
        headerLeft: () => <DrawerMenuButton />,
        tabBarStyle: {
          backgroundColor: theme.colors.bgElevated,
          borderTopWidth: 0,
          borderTopLeftRadius: mobileRadius.xl,
          borderTopRightRadius: mobileRadius.xl,
          height: 68 + insets.bottom,
          paddingBottom: Math.max(insets.bottom, 10),
          paddingTop: 10,
          paddingHorizontal: 12,
          ...mobileShadow.floating,
        },
        tabBarItemStyle: {
          paddingHorizontal: 2,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          marginTop: 3,
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
