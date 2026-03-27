import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@/providers/auth-provider';

export default function AppLayout() {
  const { bootstrapped, session } = useAuth();

  if (!bootstrapped) return null;
  if (!session.accessToken) return <Redirect href="/(auth)/login" />;

  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Vipex Mobile' }} />
      <Stack.Screen name="queue" options={{ title: 'Queue Creation' }} />
      <Stack.Screen name="rider" options={{ title: 'Rider Operations' }} />
      <Stack.Screen name="receive" options={{ title: 'Scan To Receive' }} />
      <Stack.Screen name="receive-process/[parcelId]" options={{ title: 'Process Parcel' }} />
      <Stack.Screen name="change-password" options={{ title: 'Change Password' }} />
    </Stack>
  );
}
