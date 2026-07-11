import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Link, router } from 'expo-router';
import { AppScreen } from '@mobile/components/screen';
import { forgotPassword } from '@mobile/lib/api';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { AppButton, AppCard, AppInput, AppLabel, AppPageHeader } from '@/components/ui/mobile';
import { mobileSpacing, mobileTextStyles } from '@mobile/theme/layout';

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
      const normalizedEmail = email.trim();
      await forgotPassword(normalizedEmail);
      setStatus('If the account exists, a 6-digit OTP has been sent.');
      router.push({
        pathname: '/(auth)/reset-password',
        params: { email: normalizedEmail },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppScreen>
      <AppPageHeader
        title="Forgot Password"
        subtitle="Enter your email and we will send a 6-digit OTP."
      />
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
        <AppButton title="Send OTP" onPress={() => void handleSubmit()} loading={loading} />
      </AppCard>
      <Link href="/(auth)/login" asChild>
        <Pressable style={{ marginTop: 4 }} hitSlop={8}>
          <Text style={[styles.back, { color: theme.colors.secondary }]}>Back to login</Text>
        </Pressable>
      </Link>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  formGroup: { gap: mobileSpacing.sm - 2 },
  success: { ...mobileTextStyles.footnote, fontWeight: '600' },
  error: { ...mobileTextStyles.footnote, fontWeight: '600' },
  back: { ...mobileTextStyles.footnote, fontWeight: '700' },
});
