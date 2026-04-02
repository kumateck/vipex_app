import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppScreen } from '@mobile/components/screen';
import { resetPassword } from '@mobile/lib/api';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { AppButton, AppCard, AppInput, AppLabel } from '@/components/ui/mobile';
import { mobileSpacing, mobileTypography } from '@mobile/theme/layout';

export default function ResetPasswordScreen() {
  const { theme } = useAppearance();
  const [email, setEmail] = useState('');
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
      <Text style={[styles.title, { color: theme.colors.text }]}>Reset Password</Text>
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
        <AppInput
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="New password"
        />
        <AppInput
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry
          placeholder="Confirm new password"
        />
        {status ? (
          <Text style={[styles.success, { color: theme.colors.success }]}>{status}</Text>
        ) : null}
        {error ? <Text style={[styles.error, { color: theme.colors.danger }]}>{error}</Text> : null}
        <AppButton title="Reset Password" onPress={() => void handleReset()} />
      </AppCard>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: '800' },
  formGroup: { gap: mobileSpacing.sm - 2 },
  success: { fontSize: mobileTypography.label, fontWeight: '600' },
  error: { fontSize: mobileTypography.label, fontWeight: '600' },
});
