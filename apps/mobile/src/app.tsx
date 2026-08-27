import { useEffect } from 'react';
import { ActivityIndicator, StatusBar, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { installGlobalMobileErrorHandlers } from '@mobile/lib/mobile-error-reporter';
import { useAuth } from '@mobile/providers/auth-provider';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { MobileAppDrawer, MobileProviders } from '@mobile/features/app-shell';
import { navigationRef } from '@mobile/navigation/navigation-service';
import LoginScreen from '../app/(auth)/login';
import ForgotPasswordScreen from '../app/(auth)/forgot-password';
import ResetPasswordScreen from '../app/(auth)/reset-password';
import SetPasswordScreen from '../app/(auth)/set-password';

const RootStack = createNativeStackNavigator();
const AuthStack = createNativeStackNavigator();

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
        <RootStack.Screen name="AppRoot" component={MobileAppDrawer} />
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
    <MobileProviders>
      <AppShell />
    </MobileProviders>
  );
}
