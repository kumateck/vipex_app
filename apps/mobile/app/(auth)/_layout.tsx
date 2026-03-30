import { Stack } from 'expo-router';
import { useAppearance } from '@mobile/providers/appearance-provider';

export default function AuthLayout() {
  const { theme } = useAppearance();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.bgElevated },
        headerTintColor: theme.colors.text,
        headerTitleStyle: { color: theme.colors.text, fontWeight: '700' },
        contentStyle: { backgroundColor: theme.colors.bg },
      }}
    >
      <Stack.Screen name="login" options={{ title: 'Login' }} />
      <Stack.Screen name="forgot-password" options={{ title: 'Forgot Password' }} />
      <Stack.Screen name="reset-password" options={{ title: 'Reset Password' }} />
      <Stack.Screen name="set-password" options={{ title: 'Set Password' }} />
    </Stack>
  );
}
