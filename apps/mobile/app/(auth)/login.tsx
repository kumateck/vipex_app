import { useState } from 'react';
import { Link, router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Constants from 'expo-constants';
import { AppScreen } from '@mobile/components/screen';
import { useAuth } from '@mobile/providers/auth-provider';
import { getApiDebugInfo } from '@mobile/lib/api';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { AppButton, AppCard, AppInput, AppLabel, PasswordInput } from '@/components/ui/mobile';
import { mobileRadius, mobileSpacing, mobileTextStyles } from '@mobile/theme/layout';

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
      router.replace('/(app)/(tabs)');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppScreen>
      <View style={styles.hero}>
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
          <PasswordInput value={password} onChangeText={setPassword} placeholder="••••••••" />
        </View>

        {error ? <Text style={[styles.error, { color: theme.colors.danger }]}>{error}</Text> : null}

        <AppButton
          title="Sign In"
          onPress={() => void handleLogin()}
          disabled={loading}
          loading={loading}
        />
      </AppCard>

      <View style={styles.links}>
        <Link href="/(auth)/forgot-password" asChild>
          <Pressable hitSlop={8}>
            <Text style={[styles.linkText, { color: theme.colors.secondary }]}>
              Forgot password?
            </Text>
          </Pressable>
        </Link>
        <Link href="/(auth)/set-password" asChild>
          <Pressable hitSlop={8}>
            <Text style={[styles.linkText, { color: theme.colors.secondary }]}>Set password</Text>
          </Pressable>
        </Link>
      </View>

      <View style={[styles.debugBox, { backgroundColor: theme.colors.cardMuted }]}>
        <Text style={[styles.debugTitle, { color: theme.colors.textSubtle }]}>Diagnostics</Text>
        <Text style={[styles.debugText, { color: theme.colors.textSubtle }]}>
          App {appVersion} · {configuredApiBase}
        </Text>
        <Text style={[styles.debugText, { color: theme.colors.textSubtle }]}>
          Active: {apiDebug.activeApiBaseUrl}
        </Text>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  hero: {
    paddingTop: mobileSpacing.md,
    paddingBottom: mobileSpacing.sm,
    gap: 4,
  },
  brand: { ...mobileTextStyles.eyebrow },
  title: { ...mobileTextStyles.largeTitle, marginTop: 2 },
  subtitle: { ...mobileTextStyles.subhead, marginBottom: 2 },
  formGroup: { gap: mobileSpacing.sm - 2 },
  error: { ...mobileTextStyles.footnote, fontWeight: '600' },
  links: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: mobileSpacing.md,
    paddingHorizontal: 2,
  },
  linkText: { ...mobileTextStyles.footnote, fontWeight: '700' },
  debugBox: {
    marginTop: mobileSpacing.md + 2,
    borderRadius: mobileRadius.md,
    padding: mobileSpacing.sm + 2,
    gap: 2,
  },
  debugTitle: { ...mobileTextStyles.caption2, fontWeight: '700', textTransform: 'uppercase' },
  debugText: { ...mobileTextStyles.caption2 },
});
