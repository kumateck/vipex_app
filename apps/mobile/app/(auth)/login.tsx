import { useState } from 'react';
import { Link, router } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import Constants from 'expo-constants';
import { AppScreen } from '@/components/screen';
import { useAuth } from '@/providers/auth-provider';
import { getApiDebugInfo } from '@/lib/api';
import { useAppearance } from '@/providers/appearance-provider';
import { AppButton, AppCard, AppInput, AppLabel } from '@/components/ui';
import { mobileRadius, mobileSpacing, mobileTypography } from '@/theme/layout';

export default function LoginScreen() {
  const { theme } = useAppearance();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const apiDebug = getApiDebugInfo();
  const appVersion = Constants.expoConfig?.version ?? 'unknown';
  const configuredApiBase =
    ((Constants.expoConfig?.extra ?? {}) as { apiBaseUrl?: string }).apiBaseUrl ?? 'not-set';

  async function handleLogin() {
    setError(null);
    setLoading(true);
    try {
      await login(email.trim(), password);
      router.replace('/(app)');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppScreen>
      <View
        style={[
          styles.hero,
          {
            borderColor: theme.colors.border,
            backgroundColor: theme.colors.bgElevated,
          },
        ]}
      >
        <Text style={[styles.brand, { color: theme.colors.primary }]}>VIPEX</Text>
        <Text style={[styles.title, { color: theme.colors.text }]}>Welcome back</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSubtle }]}>
          Sign in to continue to your operations workspace.
        </Text>
      </View>

      <AppCard>
        <View style={styles.formGroup}>
          <AppLabel>Email</AppLabel>
          <AppInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="you@company.com"
          />
        </View>

        <View style={styles.formGroup}>
          <AppLabel>Password</AppLabel>
          <AppInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="••••••••"
          />
        </View>

        {error ? <Text style={[styles.error, { color: theme.colors.danger }]}>{error}</Text> : null}

        <AppButton
          title={loading ? 'Signing in...' : 'Sign In'}
          onPress={() => void handleLogin()}
          disabled={loading}
        />
        {loading ? (
          <ActivityIndicator style={{ marginTop: 8 }} color={theme.colors.primary} />
        ) : null}
      </AppCard>

      <View style={styles.links}>
        <Link href="/(auth)/forgot-password" asChild>
          <Pressable>
            <Text style={[styles.linkText, { color: theme.colors.primary }]}>Forgot password?</Text>
          </Pressable>
        </Link>
        <Link href="/(auth)/set-password" asChild>
          <Pressable>
            <Text style={[styles.linkText, { color: theme.colors.primary }]}>Set password</Text>
          </Pressable>
        </Link>
      </View>

      <View
        style={[
          styles.debugBox,
          {
            borderColor: theme.colors.border,
            backgroundColor: theme.colors.cardMuted,
          },
        ]}
      >
        <Text style={[styles.debugTitle, { color: theme.colors.textMuted }]}>Debug Info</Text>
        <Text style={[styles.debugText, { color: theme.colors.textSubtle }]}>
          App version: {appVersion}
        </Text>
        <Text style={[styles.debugText, { color: theme.colors.textSubtle }]}>
          Configured API: {configuredApiBase}
        </Text>
        <Text style={[styles.debugText, { color: theme.colors.textSubtle }]}>
          Active API: {apiDebug.activeApiBaseUrl}
        </Text>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderWidth: 1,
    borderRadius: mobileRadius.xl,
    padding: mobileSpacing.lg + 2,
    gap: mobileSpacing.sm - 2,
  },
  brand: { fontSize: mobileTypography.label, letterSpacing: 1.2, fontWeight: '800' },
  title: { fontSize: 30, fontWeight: '800', marginTop: 2 },
  subtitle: { fontSize: mobileTypography.subtitle, marginBottom: 2, lineHeight: 20 },
  formGroup: { gap: mobileSpacing.sm - 2 },
  error: { fontSize: mobileTypography.label, fontWeight: '600' },
  links: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: mobileSpacing.md,
    paddingHorizontal: 2,
  },
  linkText: { fontWeight: '700', fontSize: mobileTypography.label },
  debugBox: {
    marginTop: mobileSpacing.md + 2,
    borderWidth: 1,
    borderRadius: mobileRadius.md + 2,
    padding: mobileSpacing.sm + 2,
    gap: 2,
  },
  debugTitle: { fontSize: mobileTypography.caption, fontWeight: '700' },
  debugText: { fontSize: mobileTypography.caption },
});
