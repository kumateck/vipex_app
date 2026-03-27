import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '@/providers/auth-provider';

export default function Index() {
  const { bootstrapped, session } = useAuth();

  if (!bootstrapped) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return <Redirect href={session.accessToken ? '/(app)' : '/(auth)/login'} />;
}
