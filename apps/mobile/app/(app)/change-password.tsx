import { useState } from 'react';
import { Alert } from 'react-native';
import { AppScreen } from '@mobile/components/screen';
import { changePassword } from '@mobile/lib/api';
import { useAuth } from '@mobile/providers/auth-provider';
import { AppButton, AppCard, AppLabel, AppPageHeader, PasswordInput } from '@/components/ui/mobile';

export default function ChangePasswordScreen() {
  const { session, withAuth } = useAuth();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleChange() {
    setLoading(true);
    try {
      await withAuth((token) => changePassword(token, oldPassword, newPassword));
      Alert.alert('Success', 'Password changed successfully.');
      setOldPassword('');
      setNewPassword('');
    } catch (err) {
      Alert.alert('Failed', err instanceof Error ? err.message : 'Unable to change password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppScreen>
      <AppPageHeader title="Change Password" subtitle={session.user?.email ?? undefined} />
      <AppCard>
        <AppLabel>Current password</AppLabel>
        <PasswordInput
          value={oldPassword}
          onChangeText={setOldPassword}
          placeholder="Current password"
        />
        <AppLabel>New password</AppLabel>
        <PasswordInput
          value={newPassword}
          onChangeText={setNewPassword}
          placeholder="New password"
        />
        <AppButton title="Update Password" onPress={() => void handleChange()} loading={loading} />
      </AppCard>
    </AppScreen>
  );
}
