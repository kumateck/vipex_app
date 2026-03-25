import { useState } from 'react';
import { toast } from 'sonner';

import { Button, Spinner } from '@/components/ui';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PasswordField } from '@/features/auth/components/password-field';
import { useChangePasswordMutation } from '@/features/auth/api';
import ThrowErrorMessage from '@/lib/throw-error';

export default function ChangePasswordPage() {
  const [changePassword, { isLoading }] = useChangePasswordMutation();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (oldPassword === newPassword) {
      toast.error('New password must be different from current password');
      return;
    }

    try {
      await changePassword({ oldPassword, newPassword }).unwrap();
      toast.success('Password changed successfully');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      ThrowErrorMessage(error);
    }
  };

  return (
    <div className="mx-auto w-full max-w-xl p-4 py-1">
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>
            Update your password while signed in using your current password.
          </CardDescription>
        </CardHeader>

        <form onSubmit={submit}>
          <CardContent className="space-y-4">
            <PasswordField
              id="oldPassword"
              label="Current Password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              minLength={8}
              autoComplete="current-password"
              required
            />

            <PasswordField
              id="newPassword"
              label="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={8}
              autoComplete="new-password"
              required
            />

            <PasswordField
              id="confirmPassword"
              label="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              minLength={8}
              autoComplete="new-password"
              required
            />
          </CardContent>

          <CardFooter>
            <Button type="submit" className="w-full flex gap-2" disabled={isLoading}>
              {isLoading && <Spinner />}
              {isLoading ? 'Updating password...' : 'Change Password'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
