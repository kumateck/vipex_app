import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { registerGlobals } from '@livekit/react-native';
import { AuthProvider } from '@mobile/providers/auth-provider';
import { AppUpdateProvider } from '@mobile/providers/app-update-provider';
import { CommunicationNotificationsProvider } from '@mobile/providers/communication-notifications-provider';
import { AppearanceProvider, useAppearance } from '@mobile/providers/appearance-provider';

registerGlobals();

function RootShell() {
  const { theme } = useAppearance();
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
