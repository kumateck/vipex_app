import { Redirect } from '@mobile/navigation/router-compat';

export default function LegacyAppIndexRedirect() {
  return <Redirect href="/(app)/(tabs)" />;
}
