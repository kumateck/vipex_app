import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { toast } from 'sonner';
import { PasswordField } from '@/features/auth/components/password-field';
import { useResetPasswordMutation } from '@/features/auth/api';
import ThrowErrorMessage from '@/lib/throw-error';
import { Spinner } from '@/components/ui';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const navigate = useNavigate();
  const [resetPassword, { isLoading }] = useResetPasswordMutation();

  const [password, setPassword] = useState<string>('');
  const [confirm, setConfirm] = useState<string>('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      toast.error('Reset token is missing. Please request a new reset link.');
      return;
    }

    if (password !== confirm) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      await resetPassword({ token, password }).unwrap();
      toast.success('Password reset successful. Please login.');
      navigate('/login');
    } catch (err) {
      ThrowErrorMessage(err);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Reset Password</CardTitle>
          <CardDescription>Enter a new password to complete your reset</CardDescription>
        </CardHeader>
        <form onSubmit={submit}>
          <CardContent className="space-y-4">
            <PasswordField
              id="password"
              label="New Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              autoComplete="new-password"
              required
            />
            <PasswordField
              id="confirm"
              label="Confirm Password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              minLength={8}
              autoComplete="new-password"
              required
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full flex gap-2" disabled={isLoading || !token}>
              {isLoading && <Spinner />}
              {isLoading ? 'Resetting...' : 'Reset Password'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
