import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

// adjust this import path to wherever you place the schema file
import { loginSchema, type LoginSchema } from './schema';
import { useLoginMutation } from '@/features/auth/api';
import ThrowErrorMessage from '@/lib/throw-error';
import { toast } from 'sonner';
import { Spinner } from '@/components/ui';
import { PasswordField } from '@/features/auth/components/password-field';

export function LoginForm({ className, ...props }: React.ComponentProps<'div'>) {
  const [login, { isLoading }] = useLoginMutation();
  const navigate = useNavigate();
  const location = useLocation();

  const from =
    (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/dashboard';

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
    mode: 'onSubmit',
  });
  const emailValue = watch('email');

  const onSubmit = async (data: LoginSchema) => {
    // replace with your auth call

    try {
      await login(data).unwrap();
      toast.success('Signed in successfully');
      navigate(from, { replace: true });
    } catch (error) {
      ThrowErrorMessage(error);
    }
  };

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 ">
          <form className="p-6 md:p-8" onSubmit={handleSubmit(onSubmit)}>
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">Welcome back</h1>
                <p className="text-muted-foreground text-balance">
                  Login to your Vipex Co. LTD account
                </p>
              </div>

              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  aria-invalid={!!errors.email}
                  {...register('email')}
                />
                {errors.email?.message ? (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                ) : null}
              </Field>

              <Field>
                <PasswordField
                  id="password"
                  label="Password"
                  labelClassName="gap-2 text-sm font-medium leading-snug"
                  labelAction={
                    <Link to="/forgot" className="text-sm underline-offset-2 hover:underline">
                      Forgot your password?
                    </Link>
                  }
                  placeholder="Enter your password"
                  error={errors.password?.message}
                  {...register('password')}
                />
              </Field>

              <FieldDescription className="text-center">
                <Link
                  to={`/set-password${emailValue?.trim() ? `?email=${encodeURIComponent(emailValue.trim())}` : ''}`}
                  className="text-sm underline-offset-2 hover:underline"
                >
                  Have an invite OTP? Set your password
                </Link>
              </FieldDescription>

              <Field>
                <Button type="submit" disabled={isSubmitting} className="flex gap-2">
                  {(isSubmitting || isLoading) && <Spinner />}
                  {isSubmitting ? 'Logging in...' : 'Login'}
                </Button>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>

      <FieldDescription className="px-6 text-center">
        &copy; {new Date().getFullYear()} Vipex Co. LTD. All rights reserved. Call IT Support for
        any help.
      </FieldDescription>
    </div>
  );
}
