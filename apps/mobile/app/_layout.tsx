import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '@/providers/auth-provider';
import { AppUpdateProvider } from '@/providers/app-update-provider';

export default function RootLayout() {
  return (
    <AppUpdateProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <Slot />
      </AuthProvider>
    </AppUpdateProvider>
  );
}
