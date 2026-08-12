import { useEffect } from 'react';
import { ActivityIndicator, StatusBar, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { installGlobalMobileErrorHandlers } from '@mobile/lib/mobile-error-reporter';
import { AuthProvider, useAuth } from '@mobile/providers/auth-provider';
import { AppearanceProvider, useAppearance } from '@mobile/providers/appearance-provider';
import { SnackbarProvider } from '@mobile/providers/snackbar-provider';
import { CommunicationNotificationsProvider } from '@mobile/providers/communication-notifications-provider';
import { MobileUpdateGate } from '@mobile/features/mobile-updates';
import { MobileDrawerContent } from '@mobile/components/navigation/mobile-drawer-content';
import { mobileRadius, mobileShadow } from '@mobile/theme/layout';
import { navigationRef } from '@mobile/navigation/navigation-service';
import LoginScreen from '../app/(auth)/login';
import ForgotPasswordScreen from '../app/(auth)/forgot-password';
import ResetPasswordScreen from '../app/(auth)/reset-password';
import SetPasswordScreen from '../app/(auth)/set-password';
import HomeTabScreen from '../app/(app)/(tabs)/index';
import ChatTabScreen from '../app/(app)/(tabs)/chat';
import OperationsTabScreen from '../app/(app)/(tabs)/operations';
import ParcelCreateScreen from '../app/(app)/parcel-create';
import ProfileTabScreen from '../app/(app)/(tabs)/profile';
import SuperSearchScreen from '../app/(app)/super-search';
import QueueScreen from '../app/(app)/queue';
import ReceiveScanScreen from '../app/(app)/receive';
import RiderScreen from '../app/(app)/rider';
import RiderAssignedScreen from '../app/(app)/rider-assigned';
import RiderHistoryScreen from '../app/(app)/rider-history';
import ChangePasswordScreen from '../app/(app)/change-password';
import SuperSearchRecordDetailsScreen from '../app/(app)/super-search/[parcelId]';
import ReceiveProcessParcelScreen from '../app/(app)/receive-process/[parcelId]';
import MobileCommunicationThreadPage from '../app/(app)/communication/thread/[threadId]';
import MobileVoiceChannelScreen from '../app/(app)/communication/voice/[channelId]';

const RootStack = createNativeStackNavigator();
const AuthStack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();
const Tabs = createBottomTabNavigator();

function AppTabs() {
  const { theme } = useAppearance();
  const insets = useSafeAreaInsets();

  return (
    <Tabs.Navigator
      screenOptions={{
        headerShown: false,
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
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSubtle,
      }}
    >
      <Tabs.Screen
        name="HomeTab"
        component={HomeTabScreen}
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Ionicons name="home-outline" size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="ChatTab"
        component={ChatTabScreen}
        options={{
          title: 'Chat',
          tabBarIcon: ({ color }) => (
            <Ionicons name="chatbubbles-outline" size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="SearchTab"
        component={SuperSearchScreen}
        options={{
          title: 'Search',
          tabBarIcon: ({ color }) => <Ionicons name="search-outline" size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="ProfileTab"
        component={ProfileTabScreen}
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => (
            <Ionicons name="person-circle-outline" size={20} color={color} />
          ),
        }}
      />
    </Tabs.Navigator>
  );
}

function AuthNavigator() {
  const { theme } = useAppearance();
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.bgElevated },
        headerTintColor: theme.colors.text,
        contentStyle: { backgroundColor: theme.colors.bg },
      }}
    >
      <AuthStack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      <AuthStack.Screen
        name="ForgotPassword"
        component={ForgotPasswordScreen}
        options={{ title: 'Forgot Password' }}
      />
      <AuthStack.Screen
        name="ResetPassword"
        component={ResetPasswordScreen}
        options={{ title: 'Reset Password' }}
      />
      <AuthStack.Screen
        name="SetPassword"
        component={SetPasswordScreen}
        options={{ title: 'Set Password' }}
      />
    </AuthStack.Navigator>
  );
}

function AppDrawer() {
  const { theme } = useAppearance();
  return (
    <Drawer.Navigator
      drawerContent={(props) => <MobileDrawerContent {...props} />}
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.bgElevated },
        headerTintColor: theme.colors.text,
        headerTitle: '',
        headerShadowVisible: false,
        drawerStyle: { backgroundColor: theme.colors.bgElevated, width: 300 },
      }}
    >
      <Drawer.Screen
        name="AppTabs"
        component={AppTabs}
        options={{ title: 'Dashboard', headerShown: false }}
      />
      <Drawer.Screen
        name="Operations"
        component={OperationsTabScreen}
        options={{ title: 'Operations' }}
      />
      <Drawer.Screen
        name="ParcelCreate"
        component={ParcelCreateScreen}
        options={{ title: 'Create Parcel', headerShown: false }}
      />
      <Drawer.Screen
        name="SuperSearch"
        component={SuperSearchScreen}
        options={{ title: 'Super Search' }}
      />
      <Drawer.Screen name="Queue" component={QueueScreen} options={{ headerShown: false }} />
      <Drawer.Screen
        name="Receive"
        component={ReceiveScanScreen}
        options={{ title: 'Scan To Receive' }}
      />
      <Drawer.Screen name="Rider" component={RiderScreen} options={{ title: 'Rider Operations' }} />
      <Drawer.Screen
        name="RiderAssigned"
        component={RiderAssignedScreen}
        options={{ title: 'Assigned Deliveries' }}
      />
      <Drawer.Screen
        name="RiderHistory"
        component={RiderHistoryScreen}
        options={{ title: 'Delivery History' }}
      />
      <Drawer.Screen
        name="ChangePassword"
        component={ChangePasswordScreen}
        options={{ title: 'Change Password' }}
      />
      <Drawer.Screen
        name="SuperSearchRecord"
        component={SuperSearchRecordDetailsScreen}
        options={{ title: 'Parcel Details' }}
      />
      <Drawer.Screen
        name="ReceiveProcess"
        component={ReceiveProcessParcelScreen}
        options={{ title: 'Process Parcel' }}
      />
      <Drawer.Screen
        name="CommunicationThread"
        component={MobileCommunicationThreadPage}
        options={{ title: 'Chat Thread', headerShown: false }}
      />
      <Drawer.Screen
        name="VoiceChannel"
        component={MobileVoiceChannelScreen}
        options={{ title: 'Voice Channel', headerShown: false }}
      />
    </Drawer.Navigator>
  );
}

function RootNavigator() {
  const { theme } = useAppearance();
  const { bootstrapped, session } = useAuth();
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
  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      {session.accessToken ? (
        <RootStack.Screen name="AppRoot" component={AppDrawer} />
      ) : (
        <RootStack.Screen name="AuthRoot" component={AuthNavigator} />
      )}
    </RootStack.Navigator>
  );
}

function AppShell() {
  const { theme } = useAppearance();
  useEffect(() => installGlobalMobileErrorHandlers(), []);
  useEffect(() => {
    void import('@livekit/react-native').then((mod) => mod.registerGlobals()).catch(() => {});
  }, []);
  return (
    <NavigationContainer ref={navigationRef}>
      <StatusBar barStyle={theme.statusBarStyle === 'light' ? 'light-content' : 'dark-content'} />
      <RootNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppearanceProvider>
        <AuthProvider>
          <MobileUpdateGate />
          <CommunicationNotificationsProvider>
            <SnackbarProvider>
              <AppShell />
            </SnackbarProvider>
          </CommunicationNotificationsProvider>
        </AuthProvider>
      </AppearanceProvider>
    </SafeAreaProvider>
  );
}
