import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
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
import { useSetPasswordMutation } from '@/features/auth/api';
import ThrowErrorMessage from '@/lib/throw-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot, Spinner } from '@/components/ui';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';

export default function SetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [email, setEmail] = useState<string>(searchParams.get('email') ?? '');
  const [otp, setOtp] = useState<string>('');
  const [submitSetPassword, { isLoading }] = useSetPasswordMutation();
  const [password, setPassword] = useState<string>('');
  const [confirm, setConfirm] = useState<string>('');

  const inviteOnlyErrorPhrases = [
    'User is not in invited state',
    'This OTP is for account setup. Please use Set Password.',
  ];

  function getErrorMessage(error: unknown): string {
    if (!error || typeof error !== 'object') return '';
    const err = error as {
      message?: string;
      data?: { message?: string; error?: { message?: string } };
      error?: string;
    };

    if (typeof err.message === 'string') return err.message;
    if (typeof err.data?.message === 'string') return err.data.message;
    if (typeof err.data?.error?.message === 'string') return err.data.error.message;
    if (typeof err.error === 'string') return err.error;
    return '';
  }

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
      await submitSetPassword({ email, otp, password }).unwrap();

      toast.success('Password set successfully. Please login.');
      navigate('/login');
    } catch (err) {
      const message = getErrorMessage(err);
      const shouldRedirectToForgot = inviteOnlyErrorPhrases.some((phrase) =>
        message.toLowerCase().includes(phrase.toLowerCase()),
      );

      if (shouldRedirectToForgot) {
        toast.error('Account already activated. Use Forgot Password to reset your password.');
        navigate(`/forgot${email ? `?email=${encodeURIComponent(email)}` : ''}`);
        return;
      }

      ThrowErrorMessage(err);
    }
  };

  return (
    <ScrollableWrapper className="p-6">
      <div className="min-h-screen grid place-items-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Set Password</CardTitle>
            <CardDescription>
              For first-time invited users only. If your account is already active, use Forgot
              Password.
            </CardDescription>
          </CardHeader>

          <form onSubmit={submit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="set-email">Email</Label>
                <Input
                  id="set-email"
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
              <div className="w-full space-y-2 py-5">
                <Button
                  type="submit"
                  className="w-full flex gap-2"
                  disabled={isLoading || otp.length !== 6 || !email.trim()}
                >
                  {isLoading && <Spinner />}
                  {isLoading ? 'Setting password...' : 'Set Password'}
                </Button>
                <Button asChild type="button" variant="outline" className="w-full">
                  <Link to="/login">Return to login</Link>
                </Button>
                <Button asChild type="button" variant="secondary" className="w-full">
                  <Link to={`/forgot${email ? `?email=${encodeURIComponent(email)}` : ''}`}>
                    Forgot Password Instead
                  </Link>
                </Button>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </ScrollableWrapper>
  );
}
