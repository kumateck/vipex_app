import { useState } from 'react';
import { Alert, Button, StyleSheet, Text, TextInput } from 'react-native';
import { AppScreen } from '@/components/screen';
import { changePassword } from '@/lib/api';
import { useAuth } from '@/providers/auth-provider';

export default function ChangePasswordScreen() {
  const { session, withAuth } = useAuth();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  async function handleChange() {
    try {
      await withAuth((token) => changePassword(token, oldPassword, newPassword));
      Alert.alert('Success', 'Password changed successfully.');
      setOldPassword('');
      setNewPassword('');
    } catch (err) {
      Alert.alert('Failed', err instanceof Error ? err.message : 'Unable to change password');
    }
  }

  return (
    <AppScreen>
      <Text style={styles.title}>Change Password</Text>
      <Text style={styles.meta}>User: {session.user?.email ?? '-'}</Text>
      <TextInput
        style={styles.input}
        value={oldPassword}
        onChangeText={setOldPassword}
        secureTextEntry
        placeholder="Current password"
      />
      <TextInput
        style={styles.input}
        value={newPassword}
        onChangeText={setNewPassword}
        secureTextEntry
        placeholder="New password"
      />
      <Button title="Update password" onPress={handleChange} />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '700' },
  meta: { color: '#475467' },
  input: {
    borderWidth: 1,
    borderColor: '#d0d5dd',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
});
