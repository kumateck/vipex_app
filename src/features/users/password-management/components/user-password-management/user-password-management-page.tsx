import { KeyRound, ShieldCheck } from 'lucide-react';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPasswordManagementForm } from './user-password-management-form';

export function UserPasswordManagementPage() {
  return (
    <ScrollableWrapper>
      <div className="mx-auto w-full max-w-3xl space-y-5 p-4 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="bg-primary/10 text-primary rounded-xl p-2.5">
            <KeyRound className="size-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Set User Password</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Assign a secure new password to an existing user account.
            </p>
          </div>
        </div>

        <Card className="overflow-hidden">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShieldCheck className="text-primary size-5" /> System Admin access
            </CardTitle>
            <CardDescription>
              This action is restricted to System Admins and is recorded in the audit log.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <UserPasswordManagementForm />
          </CardContent>
        </Card>
      </div>
    </ScrollableWrapper>
  );
}
