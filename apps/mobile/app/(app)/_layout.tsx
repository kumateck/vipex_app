import { Redirect } from '@mobile/navigation/router-compat';
import { Drawer } from '@mobile/navigation/drawer-compat';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { DrawerActions } from '@react-navigation/native';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { useAuth } from '@mobile/providers/auth-provider';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { MobileDrawerContent } from '@mobile/components/navigation/mobile-drawer-content';

export default function AppLayout() {
  const { bootstrapped, session } = useAuth();
  const { theme } = useAppearance();

  if (!bootstrapped) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.colors.bg,
        }}
      >
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }
  if (!session.accessToken) return <Redirect href="/(auth)/login" />;

  return (
    <Drawer
      drawerContent={(props) => <MobileDrawerContent {...props} />}
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.bgElevated, elevation: 0, shadowOpacity: 0 },
        headerTintColor: theme.colors.text,
        headerTitleStyle: { color: theme.colors.text, fontWeight: '600', fontSize: 17 },
        headerShadowVisible: false,
        sceneStyle: { backgroundColor: theme.colors.bg },
        drawerStyle: { backgroundColor: theme.colors.bgElevated, width: 300 },
        drawerActiveTintColor: theme.colors.primary,
        drawerInactiveTintColor: theme.colors.textSubtle,
        drawerActiveBackgroundColor: `${theme.colors.primary}1F`,
        drawerItemStyle: { borderRadius: 12 },
        drawerLabelStyle: { fontWeight: '600', fontSize: 15 },
      }}
    >
      <Drawer.Screen
        name="(tabs)"
        options={{
          title: 'Dashboard',
          headerShown: false,
          drawerIcon: ({ size, color }) => (
            <Ionicons name="grid-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="super-search"
        options={({ navigation }) => ({
          title: 'Super Search',
          headerLeft: () => (
            <Pressable
              onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
              style={{ paddingHorizontal: 12, paddingVertical: 6 }}
              accessibilityRole="button"
              accessibilityLabel="Open side menu"
            >
              <Ionicons name="menu-outline" size={22} color={theme.colors.text} />
            </Pressable>
          ),
          drawerItemStyle: { display: 'none' },
        })}
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
        name="parcel-create"
        options={{
          title: 'Create Parcel',
          headerShown: false,
          drawerIcon: ({ size, color }) => (
            <Ionicons name="cash-outline" size={size} color={color} />
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
        name="rider-assigned"
        options={{
          title: 'Assigned Deliveries',
          headerShown: false,
          drawerItemStyle: { display: 'none' },
        }}
      />
      <Drawer.Screen
        name="rider-history"
        options={{
          title: 'Delivery History',
          drawerItemStyle: { display: 'none' },
        }}
      />
      <Drawer.Screen
        name="receive"
        options={{
          title: 'Scan To Receive',
          headerShown: false,
          drawerIcon: ({ size, color }) => (
            <Ionicons name="qr-code-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="change-password"
        options={({ navigation }) => ({
          title: 'Change Password',
          headerLeft: () => (
            <Pressable
              onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
              style={{ paddingHorizontal: 12, paddingVertical: 6 }}
              accessibilityRole="button"
              accessibilityLabel="Open side menu"
            >
              <Ionicons name="menu-outline" size={22} color={theme.colors.text} />
            </Pressable>
          ),
          drawerIcon: ({ size, color }) => (
            <Ionicons name="key-outline" size={size} color={color} />
          ),
        })}
      />
      <Drawer.Screen
        name="cashier-sales-report"
        options={{
          title: 'Cashier Sales Report',
          headerShown: false,
          drawerItemStyle: { display: 'none' },
        }}
      />
      <Drawer.Screen
        name="super-search/[parcelId]"
        options={{
          title: 'Parcel Details',
          headerShown: false,
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
          headerShown: false,
          drawerItemStyle: { display: 'none' },
        }}
      />
      <Drawer.Screen
        name="communication/voice/[channelId]"
        options={{
          title: 'Voice Channel',
          headerShown: false,
          drawerItemStyle: { display: 'none' },
        }}
      />
    </Drawer>
  );
}
