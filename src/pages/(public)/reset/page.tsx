import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InputOTP, InputOTPGroup, InputOTPSlot, Spinner, InputOTPSeparator } from '@/components/ui';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState<string>(searchParams.get('email') ?? '');
  const [otp, setOtp] = useState<string>('');
  const navigate = useNavigate();
  const [resetPassword, { isLoading }] = useResetPasswordMutation();

  const [password, setPassword] = useState<string>('');
  const [confirm, setConfirm] = useState<string>('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (otp.length !== 6) {
      toast.error('Enter the 6-digit OTP sent to your email.');
      return;
    }

    if (password !== confirm) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      await resetPassword({ email, otp, password }).unwrap();
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
          <CardDescription>Enter your email, 6-digit OTP, and new password</CardDescription>
        </CardHeader>
        <form onSubmit={submit}>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="reset-email">Email</Label>
              <Input
                id="reset-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>OTP Code</Label>
              <InputOTP maxLength={6} value={otp} onChange={setOtp} pattern="^[0-9]+$">
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                </InputOTPGroup>
                <InputOTPSeparator className="mx-0.5" />
                <InputOTPGroup>
                  <InputOTPSlot index={1} />
                </InputOTPGroup>
                <InputOTPSeparator className="mx-0.5" />
                <InputOTPGroup>
                  <InputOTPSlot index={2} />
                </InputOTPGroup>
                <InputOTPSeparator className="mx-0.5" />
                <InputOTPGroup>
                  <InputOTPSlot index={3} />
                </InputOTPGroup>
                <InputOTPSeparator className="mx-0.5" />
                <InputOTPGroup>
                  <InputOTPSlot index={4} />
                </InputOTPGroup>
                <InputOTPSeparator className="mx-0.5" />
                <InputOTPGroup>
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>
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
          <CardFooter className="py-5">
            <div className="w-full space-y-2">
              <Button
                type="submit"
                className="w-full flex gap-2"
                disabled={isLoading || otp.length !== 6 || !email.trim()}
              >
                {isLoading && <Spinner />}
                {isLoading ? 'Resetting...' : 'Reset Password'}
              </Button>
              <Button asChild type="button" variant="secondary" className="w-full">
                <Link to={`/set-password${email ? `?email=${encodeURIComponent(email)}` : ''}`}>
                  Invite OTP? Set password instead
                </Link>
              </Button>
              <Button asChild type="button" variant="outline" className="w-full">
                <Link to="/login">Return to login</Link>
              </Button>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
