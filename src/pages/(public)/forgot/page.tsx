import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { toast } from 'sonner';
import { useForgotPasswordMutation } from '@/features/auth/api';
import ThrowErrorMessage from '@/lib/throw-error';
import { Spinner } from '@/components/ui';

export default function ForgotPassword() {
  const [email, setEmail] = useState<string>('');
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await forgotPassword({ email }).unwrap();
      toast.success('If the email exists, a 6-digit OTP has been sent');
    } catch (err) {
      ThrowErrorMessage(err);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Forgot Password</CardTitle>
          <CardDescription>Enter your account email to receive a 6-digit OTP</CardDescription>
          <p className="text-xs text-muted-foreground">
            Use <strong>reset OTP</strong> if your account is already active. Use{' '}
            <strong>invite OTP</strong> only for first-time account setup.
          </p>
        </CardHeader>
        <form onSubmit={onSubmit}>
          <CardContent className="space-y-4 pb-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter>
            <div className="w-full space-y-2">
              <Button type="submit" className="w-full flex gap-2" disabled={isLoading}>
                {isLoading && <Spinner />}
                {isLoading ? 'Sending...' : 'Send OTP'}
              </Button>
              <Button asChild type="button" variant="secondary" className="w-full">
                <Link to={`/reset${email ? `?email=${encodeURIComponent(email)}` : ''}`}>
                  I have an OTP
                </Link>
              </Button>
              <Button asChild type="button" variant="secondary" className="w-full">
                <Link to={`/set-password${email ? `?email=${encodeURIComponent(email)}` : ''}`}>
                  I have an invite OTP
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
