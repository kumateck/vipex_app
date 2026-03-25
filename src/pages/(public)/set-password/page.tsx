import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PasswordField } from '@/features/auth/components/password-field';
import { useResetPasswordMutation } from '@/features/auth/api';
import ThrowErrorMessage from '@/lib/throw-error';
import { Spinner } from '@/components/ui';

export default function SetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get('token') ?? '';
  const [resetPassword, { isLoading }] = useResetPasswordMutation();
  const [password, setPassword] = useState<string>('');
  const [confirm, setConfirm] = useState<string>('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      toast.error('Invitation token is missing. Please request a new invite link.');
      return;
    }

    if (password !== confirm) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      await resetPassword({ token, password }).unwrap();

      toast.success('Password set successfully. Please login.');
      navigate('/login');
    } catch (err) {
      ThrowErrorMessage(err);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Set Password</CardTitle>
          <CardDescription>Create your password to activate your invited account</CardDescription>
        </CardHeader>

        <form onSubmit={submit}>
          <CardContent className="space-y-4">
            <PasswordField
              id="password"
              label="Password"
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
              {isLoading ? 'Setting password...' : 'Set Password'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
