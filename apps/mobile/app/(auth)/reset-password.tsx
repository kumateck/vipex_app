import { useState } from 'react';
import { Button, StyleSheet, Text, TextInput, View } from 'react-native';
import { AppScreen } from '@/components/screen';
import { resetPassword } from '@/lib/api';

export default function ResetPasswordScreen() {
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
      <Text style={styles.title}>Reset Password</Text>
      <View style={styles.formGroup}>
        <Text>Email</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="you@example.com"
        />
      </View>
      <View style={styles.formGroup}>
        <Text>OTP (6 digits)</Text>
        <TextInput
          style={styles.input}
          value={otp}
          onChangeText={(v) => setOtp(v.replace(/\D/g, '').slice(0, 6))}
          keyboardType="number-pad"
          placeholder="123456"
          maxLength={6}
        />
      </View>
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholder="New password"
      />
      <TextInput
        style={styles.input}
        value={confirm}
        onChangeText={setConfirm}
        secureTextEntry
        placeholder="Confirm new password"
      />
      {status ? <Text style={styles.success}>{status}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button title="Reset Password" onPress={handleReset} />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: '700' },
  formGroup: { gap: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#d0d5dd',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  success: { color: '#067647' },
  error: { color: '#b42318' },
});
