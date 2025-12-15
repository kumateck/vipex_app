import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

export function LoginForm({ className, ...props }: React.ComponentProps<'div'>) {
  const [showPassword, setShowPassword] = useState(false);
  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 ">
          <form className="p-6 md:p-8">
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">Welcome back</h1>
                <p className="text-muted-foreground text-balance">
                  Login to your Vipex Co. LTD account
                </p>
              </div>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input id="email" type="email" placeholder="Enter your email" />
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
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                  />
                  <InputGroupAddon align="inline-end">
                    {showPassword ? (
                      <EyeOff onClick={() => setShowPassword(false)} />
                    ) : (
                      <Eye onClick={() => setShowPassword(true)} />
                    )}
                  </InputGroupAddon>
                </InputGroup>
              </Field>
              <Field>
                <Button type="submit">Login</Button>
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
