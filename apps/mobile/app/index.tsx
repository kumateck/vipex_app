import { Redirect } from '@mobile/navigation/router-compat';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '@mobile/providers/auth-provider';
import { useAppearance } from '@mobile/providers/appearance-provider';

export default function Index() {
  const { theme } = useAppearance();
  const { bootstrapped, session } = useAuth();

  if (!bootstrapped) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: theme.colors.bg,
        }}
      >
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  return <Redirect href={session.accessToken ? '/(app)/(tabs)' : '/(auth)/login'} />;
}
