import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Pressable } from 'react-native';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { useAppearance } from '@mobile/providers/appearance-provider';

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
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSubtle,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="operations"
        options={{
          title: 'Operations',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="briefcase-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="communication"
        options={{
          title: 'Communication',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubbles-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-circle-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
