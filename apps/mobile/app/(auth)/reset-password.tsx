import { useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { Button, StyleSheet, Text, TextInput } from 'react-native';
import { AppScreen } from '@/components/screen';
import { resetPassword } from '@/lib/api';

export default function ResetPasswordScreen() {
  const params = useLocalSearchParams<{ token?: string }>();
  const token = typeof params.token === 'string' ? params.token : '';

  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleReset() {
    setStatus(null);
    setError(null);
    try {
      if (!token) throw new Error('Reset token is missing. Open link with token.');
      await resetPassword(token, password);
      setStatus('Password reset successful. You can login now.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reset failed');
    }
  }

  return (
    <AppScreen>
      <Text style={styles.title}>Reset Password</Text>
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholder="New password"
      />
      {status ? <Text style={styles.success}>{status}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button title="Reset Password" onPress={handleReset} />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: '700' },
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
