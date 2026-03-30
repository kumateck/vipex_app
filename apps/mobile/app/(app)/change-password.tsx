import { useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';
import { AppScreen } from '@/components/screen';
import { changePassword } from '@/lib/api';
import { useAuth } from '@/providers/auth-provider';
import { useAppearance } from '@/providers/appearance-provider';
import { AppButton, AppCard, AppInput } from '@/components/ui';
import { mobileTypography } from '@/theme/layout';

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
      <Text style={[styles.title, { color: theme.colors.text }]}>Change Password</Text>
      <Text style={[styles.meta, { color: theme.colors.textSubtle }]}>
        User: {session.user?.email ?? '-'}
      </Text>
      <AppCard>
        <AppInput
          value={oldPassword}
          onChangeText={setOldPassword}
          secureTextEntry
          placeholder="Current password"
        />
        <AppInput
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
          placeholder="New password"
        />
        <AppButton title="Update password" onPress={() => void handleChange()} />
      </AppCard>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: mobileTypography.title, fontWeight: '700' },
  meta: {},
});
