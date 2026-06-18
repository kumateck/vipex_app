import { useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';
import { AppScreen } from '@mobile/components/screen';
import { changePassword } from '@mobile/lib/api';
import { useAuth } from '@mobile/providers/auth-provider';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { AppButton, AppCard, PasswordInput } from '@/components/ui/mobile';

export default function ChangePasswordScreen() {
  const { theme } = useAppearance();
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
      <Text style={[styles.meta, { color: theme.colors.textSubtle }]}>
        User: {session.user?.email ?? '-'}
      </Text>
      <AppCard>
        <PasswordInput
          value={oldPassword}
          onChangeText={setOldPassword}
          placeholder="Current password"
        />
        <PasswordInput
          value={newPassword}
          onChangeText={setNewPassword}
          placeholder="New password"
        />
        <AppButton title="Update password" onPress={() => void handleChange()} />
      </AppCard>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  meta: {},
});
