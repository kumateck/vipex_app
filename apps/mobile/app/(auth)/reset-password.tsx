import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Link, useLocalSearchParams } from 'expo-router';
import { AppScreen } from '@mobile/components/screen';
import { resetPassword } from '@mobile/lib/api';
import { useAppearance } from '@mobile/providers/appearance-provider';
import {
  AppButton,
  AppCard,
  AppInput,
  AppLabel,
  AppPageHeader,
  PasswordInput,
} from '@/components/ui/mobile';
import { mobileSpacing, mobileTextStyles } from '@mobile/theme/layout';

export default function ResetPasswordScreen() {
  const { theme } = useAppearance();
  const params = useLocalSearchParams<{ email?: string }>();
  const initialEmail = useMemo(
    () => (typeof params.email === 'string' ? params.email : ''),
    [params.email],
  );
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleReset() {
    setStatus(null);
    setError(null);
    try {
      if (otp.trim().length !== 6) throw new Error('OTP must be 6 digits.');
      if (password !== confirm) throw new Error('Passwords do not match.');
      await resetPassword(email.trim(), otp.trim(), password);
      setStatus('Password reset successful. You can login now.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reset failed');
    }
  }

  return (
    <AppScreen>
      <AppPageHeader title="Reset Password" />
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
        <View style={styles.formGroup}>
          <AppLabel>OTP (6 digits)</AppLabel>
          <AppInput
            value={otp}
            onChangeText={(v: string) => setOtp(v.replace(/\D/g, '').slice(0, 6))}
            keyboardType="number-pad"
            placeholder="123456"
            maxLength={6}
          />
        </View>
        <PasswordInput value={password} onChangeText={setPassword} placeholder="New password" />
        <PasswordInput
          value={confirm}
          onChangeText={setConfirm}
          placeholder="Confirm new password"
        />
        {status ? (
          <Text style={[styles.success, { color: theme.colors.success }]}>{status}</Text>
        ) : null}
        {error ? <Text style={[styles.error, { color: theme.colors.danger }]}>{error}</Text> : null}
        <AppButton title="Reset Password" onPress={() => void handleReset()} />
        {status ? (
          <Link href="/(auth)/login" style={[styles.link, { color: theme.colors.secondary }]}>
            Back to login
          </Link>
        ) : null}
      </AppCard>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  formGroup: { gap: mobileSpacing.sm - 2 },
  success: { ...mobileTextStyles.footnote, fontWeight: '600' },
  error: { ...mobileTextStyles.footnote, fontWeight: '600' },
  link: { ...mobileTextStyles.footnote, fontWeight: '700' },
});
