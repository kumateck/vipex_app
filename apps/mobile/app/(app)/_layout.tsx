import { Redirect } from 'expo-router';
import { Drawer } from 'expo-router/drawer';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@mobile/providers/auth-provider';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { MobileDrawerContent } from '@mobile/components/navigation/mobile-drawer-content';

export default function AppLayout() {
  const { bootstrapped, session } = useAuth();
  const { theme } = useAppearance();

  if (!bootstrapped) return null;
  if (!session.accessToken) return <Redirect href="/(auth)/login" />;

  return (
    <Drawer
      drawerContent={(props) => <MobileDrawerContent {...props} />}
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.bgElevated },
        headerTintColor: theme.colors.text,
        headerTitleStyle: { color: theme.colors.text, fontWeight: '700' },
        sceneStyle: { backgroundColor: theme.colors.bg },
        drawerStyle: { backgroundColor: theme.colors.bgElevated },
        drawerActiveTintColor: theme.colors.primary,
        drawerInactiveTintColor: theme.colors.textSubtle,
        drawerLabelStyle: { fontWeight: '600' },
      }}
    >
      <Drawer.Screen
        name="(tabs)"
        options={{
          title: 'Workspace',
          headerShown: false,
          drawerIcon: ({ size, color }) => (
            <Ionicons name="grid-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="super-search"
        options={{
          title: 'Super Search',
          drawerIcon: ({ size, color }) => (
            <Ionicons name="search-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="global-search"
        options={{
          title: 'Global Search',
          drawerIcon: ({ size, color }) => (
            <Ionicons name="search-circle-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="queue"
        options={{
          title: 'Queue Creation',
          drawerIcon: ({ size, color }) => (
            <Ionicons name="ticket-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="rider"
        options={{
          title: 'Rider Operations',
          drawerIcon: ({ size, color }) => (
            <Ionicons name="bicycle-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="receive"
        options={{
          title: 'Scan To Receive',
          drawerIcon: ({ size, color }) => (
            <Ionicons name="qr-code-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="change-password"
        options={{
          title: 'Change Password',
          drawerIcon: ({ size, color }) => (
            <Ionicons name="key-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="super-search/[parcelId]"
        options={{
          title: 'Record Details',
          drawerItemStyle: { display: 'none' },
        }}
      />
      <Drawer.Screen
        name="receive-process/[parcelId]"
        options={{
          title: 'Process Parcel',
          drawerItemStyle: { display: 'none' },
        }}
      />
      <Drawer.Screen
        name="communication/thread/[threadId]"
        options={{
          title: 'Chat Thread',
          drawerItemStyle: { display: 'none' },
        }}
      />
      <Drawer.Screen
        name="communication/voice/[channelId]"
        options={{
          title: 'Voice Channel',
          drawerItemStyle: { display: 'none' },
        }}
      />
    </Drawer>
  );
}
