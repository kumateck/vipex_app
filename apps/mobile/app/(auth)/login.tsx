import { useState } from 'react';
import { Link, router } from 'expo-router';
import { ActivityIndicator, Button, StyleSheet, Text, TextInput, View } from 'react-native';
import Constants from 'expo-constants';
import { AppScreen } from '@/components/screen';
import { useAuth } from '@/providers/auth-provider';
import { getApiDebugInfo } from '@/lib/api';

export default function LoginScreen() {
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
      <Text style={styles.title}>Vipex Mobile</Text>
      <Text style={styles.subtitle}>Login to continue</Text>

      <View style={styles.formGroup}>
        <Text>Email</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="you@company.com"
          placeholderTextColor="#667085"
        />
      </View>

      <View style={styles.formGroup}>
        <Text>Password</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="••••••••"
          placeholderTextColor="#667085"
        />
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Button
        title={loading ? 'Signing in...' : 'Login'}
        onPress={handleLogin}
        disabled={loading}
      />
      {loading ? <ActivityIndicator style={{ marginTop: 8 }} /> : null}

      <View style={styles.links}>
        <Link href="/(auth)/forgot-password">
          <Text>Forgot password?</Text>
        </Link>
        <Link href="/(auth)/set-password">
          <Text>Set password (invite)</Text>
        </Link>
      </View>

      <View style={styles.debugBox}>
        <Text style={styles.debugTitle}>Debug Info</Text>
        <Text style={styles.debugText}>App version: {appVersion}</Text>
        <Text style={styles.debugText}>Configured API: {configuredApiBase}</Text>
        <Text style={styles.debugText}>Active API: {apiDebug.activeApiBaseUrl}</Text>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: '700', marginTop: 8 },
  subtitle: { color: '#475467', marginBottom: 12 },
  formGroup: { gap: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#d0d5dd',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
    color: '#101828',
  },
  error: { color: '#b42318' },
  links: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  debugBox: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#d0d5dd',
    borderRadius: 10,
    padding: 10,
    backgroundColor: '#f8f9fc',
    gap: 2,
  },
  debugTitle: { fontSize: 12, fontWeight: '700', color: '#344054' },
  debugText: { fontSize: 12, color: '#475467' },
});
