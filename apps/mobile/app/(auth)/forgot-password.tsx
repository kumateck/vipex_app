import { useState } from 'react';
import { Button, StyleSheet, Text, TextInput, View } from 'react-native';
import { Link } from 'expo-router';
import { AppScreen } from '@/components/screen';
import { forgotPassword } from '@/lib/api';

export default function ForgotPasswordScreen() {
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
      setStatus('If the account exists, a reset link has been sent.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppScreen>
      <Text style={styles.title}>Forgot Password</Text>
      <View style={styles.formGroup}>
        <Text>Email</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
      </View>
      {status ? <Text style={styles.success}>{status}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button title={loading ? 'Submitting...' : 'Send reset link'} onPress={handleSubmit} />
      <Link href="/(auth)/login" style={{ marginTop: 12 }}>
        <Text>Back to login</Text>
      </Link>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: '700', marginBottom: 8 },
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
