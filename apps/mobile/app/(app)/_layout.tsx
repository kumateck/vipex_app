import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@mobile/providers/auth-provider';
import { useAppearance } from '@mobile/providers/appearance-provider';

export default function AppLayout() {
  const { bootstrapped, session } = useAuth();
  const { theme } = useAppearance();

  if (!bootstrapped) return null;
  if (!session.accessToken) return <Redirect href="/(auth)/login" />;

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.bgElevated },
        headerTintColor: theme.colors.text,
        headerTitleStyle: { color: theme.colors.text, fontWeight: '700' },
        contentStyle: { backgroundColor: theme.colors.bg },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="queue" options={{ title: 'Queue Creation' }} />
      <Stack.Screen name="rider" options={{ title: 'Rider Operations' }} />
      <Stack.Screen name="receive" options={{ title: 'Scan To Receive' }} />
      <Stack.Screen name="receive-process/[parcelId]" options={{ title: 'Process Parcel' }} />
      <Stack.Screen name="communication/thread/[threadId]" options={{ title: 'Chat Thread' }} />
      <Stack.Screen name="communication/voice/[channelId]" options={{ title: 'Voice Channel' }} />
      <Stack.Screen name="change-password" options={{ title: 'Change Password' }} />
    </Stack>
  );
}
