import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '@mobile/providers/auth-provider';
import { AppUpdateProvider } from '@mobile/providers/app-update-provider';
import { AppearanceProvider, useAppearance } from '@mobile/providers/appearance-provider';

function RootShell() {
  const { theme } = useAppearance();
  return (
    <AppUpdateProvider>
      <AuthProvider>
        <StatusBar style={theme.statusBarStyle} />
        <Slot />
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
