import 'react-native-gesture-handler';
import '@mobile/lib/polyfills';
import { installGlobalMobileErrorHandlers } from '@mobile/lib/mobile-error-reporter';
import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { AuthProvider } from '@mobile/providers/auth-provider';
import { AppUpdateProvider } from '@mobile/providers/app-update-provider';
import { CommunicationNotificationsProvider } from '@mobile/providers/communication-notifications-provider';
import { AppearanceProvider, useAppearance } from '@mobile/providers/appearance-provider';
import { SnackbarProvider } from '@mobile/providers/snackbar-provider';

function RootShell() {
  const { theme } = useAppearance();

  useEffect(() => {
    installGlobalMobileErrorHandlers();
  }, []);

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
          <SnackbarProvider>
            <StatusBar style={theme.statusBarStyle} />
            <Slot />
          </SnackbarProvider>
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
