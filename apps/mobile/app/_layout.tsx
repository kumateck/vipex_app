import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '@/providers/auth-provider';
import { AppUpdateProvider } from '@/providers/app-update-provider';
import { AppearanceProvider, useAppearance } from '@/providers/appearance-provider';

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
