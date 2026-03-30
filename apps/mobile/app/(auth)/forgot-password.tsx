import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { AppScreen } from '@/components/screen';
import { forgotPassword } from '@/lib/api';
import { useAppearance } from '@/providers/appearance-provider';
import { AppButton, AppCard, AppInput, AppLabel } from '@/components/ui';
import { mobileSpacing, mobileTypography } from '@/theme/layout';

export default function ForgotPasswordScreen() {
  const { theme } = useAppearance();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setLoading(true);
    setError(null);
    setStatus(null);
    try {
      await forgotPassword(email.trim());
      setStatus('If the account exists, a 6-digit OTP has been sent.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppScreen>
      <Text style={[styles.title, { color: theme.colors.text }]}>Forgot Password</Text>
      <Text style={[styles.meta, { color: theme.colors.textSubtle }]}>
        Enter your email and we will send a 6-digit OTP.
      </Text>
      <AppCard>
        <View style={styles.formGroup}>
          <AppLabel>Email</AppLabel>
          <AppInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="you@example.com"
          />
        </View>
        {status ? (
          <Text style={[styles.success, { color: theme.colors.success }]}>{status}</Text>
        ) : null}
        {error ? <Text style={[styles.error, { color: theme.colors.danger }]}>{error}</Text> : null}
        <AppButton
          title={loading ? 'Submitting...' : 'Send OTP'}
          onPress={() => void handleSubmit()}
        />
      </AppCard>
      <Link href="/(auth)/login" asChild>
        <Pressable style={{ marginTop: 12 }}>
          <Text style={[styles.back, { color: theme.colors.primary }]}>Back to login</Text>
        </Pressable>
      </Link>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: '800', marginBottom: 2 },
  meta: { marginBottom: mobileSpacing.sm },
  formGroup: { gap: mobileSpacing.sm - 2 },
  success: { fontSize: mobileTypography.label, fontWeight: '600' },
  error: { fontSize: mobileTypography.label, fontWeight: '600' },
  back: { fontWeight: '700' },
});
