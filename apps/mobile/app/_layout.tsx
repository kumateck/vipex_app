import 'react-native-gesture-handler';
import '@mobile/lib/polyfills';
import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { AuthProvider } from '@mobile/providers/auth-provider';
import { AppUpdateProvider } from '@mobile/providers/app-update-provider';
import { CommunicationNotificationsProvider } from '@mobile/providers/communication-notifications-provider';
import { AppearanceProvider, useAppearance } from '@mobile/providers/appearance-provider';

function RootShell() {
  const { theme } = useAppearance();

  useEffect(() => {
    void (async () => {
      try {
        const mod = await import('@livekit/react-native');
        // In Expo Go / unsupported runtime this may fail; keep app boot resilient.
        mod.registerGlobals();
      } catch {
        // Non-blocking: voice room features will require proper dev/prod build.
      }
    })();
  }, []);

  return (
    <AppUpdateProvider>
      <AuthProvider>
        <CommunicationNotificationsProvider>
          <StatusBar style={theme.statusBarStyle} />
          <Slot />
        </CommunicationNotificationsProvider>
      </AuthProvider>
    </AppUpdateProvider>
  );
}

export default function RootLayout() {
  return (
    <AppearanceProvider>
      <RootShell />
    </AppearanceProvider>
  );
}
