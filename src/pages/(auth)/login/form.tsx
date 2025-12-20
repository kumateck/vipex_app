import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

// adjust this import path to wherever you place the schema file
import { loginSchema, type LoginSchema } from './schema';
import { useLoginMutation } from '@/features/auth/api';
import { useLocation, useNavigate } from 'react-router-dom';
import ThrowErrorMessage from '@/lib/throw-error';
import { toast } from 'sonner';
import { Spinner } from '@/components/ui';

export function LoginForm({ className, ...props }: React.ComponentProps<'div'>) {
  const [showPassword, setShowPassword] = useState(false);
  const [login, { isLoading }] = useLoginMutation();
  const navigate = useNavigate();
  const location = useLocation();

  const from =
    (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/dashboard';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
    mode: 'onSubmit',
  });

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
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <a href="#" className="ml-auto text-sm underline-offset-2 hover:underline">
                    Forgot your password?
                  </a>
                </div>

                <InputGroup>
                  <InputGroupInput
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    aria-invalid={!!errors.password}
                    {...register('password')}
                  />
                  <InputGroupAddon align="inline-end">
                    {showPassword ? (
                      <EyeOff
                        onClick={() => setShowPassword(false)}
                        className="cursor-pointer"
                        aria-label="Hide password"
                      />
                    ) : (
                      <Eye
                        onClick={() => setShowPassword(true)}
                        className="cursor-pointer"
                        aria-label="Show password"
                      />
                    )}
                  </InputGroupAddon>
                </InputGroup>

                {errors.password?.message ? (
                  <p className="text-sm text-destructive">{errors.password.message}</p>
                ) : null}
              </Field>

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
