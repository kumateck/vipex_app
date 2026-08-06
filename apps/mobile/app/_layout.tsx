import 'react-native-gesture-handler';
import '@mobile/lib/polyfills';
import { installGlobalMobileErrorHandlers } from '@mobile/lib/mobile-error-reporter';
import { Slot } from '@mobile/navigation/router-compat';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useEffect } from 'react';
import { AuthProvider } from '@mobile/providers/auth-provider';
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
        // In unsupported runtimes this may fail; keep app boot resilient.
        mod.registerGlobals();
      } catch {
        // Non-blocking: voice room features will require proper dev/prod build.
      }
    })();
  }, []);

  return (
    <AuthProvider>
      <CommunicationNotificationsProvider>
        <SnackbarProvider>
          <StatusBar
            barStyle={theme.statusBarStyle === 'light' ? 'light-content' : 'dark-content'}
          />
          <Slot />
        </SnackbarProvider>
      </CommunicationNotificationsProvider>
    </AuthProvider>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppearanceProvider>
        <RootShell />
      </AppearanceProvider>
    </SafeAreaProvider>
  );
}
