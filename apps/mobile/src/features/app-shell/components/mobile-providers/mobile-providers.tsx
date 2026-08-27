import type { PropsWithChildren } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MobileUpdateGate } from '@mobile/features/mobile-updates';
import { AppearanceProvider } from '@mobile/providers/appearance-provider';
import { AuthProvider } from '@mobile/providers/auth-provider';
import { CommunicationNotificationsProvider } from '@mobile/providers/communication-notifications-provider';
import { SnackbarProvider } from '@mobile/providers/snackbar-provider';

export function MobileProviders({ children }: PropsWithChildren) {
  return (
    <SafeAreaProvider>
      <AppearanceProvider>
        <AuthProvider>
          <MobileUpdateGate />
          <CommunicationNotificationsProvider>
            <SnackbarProvider>{children}</SnackbarProvider>
          </CommunicationNotificationsProvider>
        </AuthProvider>
      </AppearanceProvider>
    </SafeAreaProvider>
  );
}
