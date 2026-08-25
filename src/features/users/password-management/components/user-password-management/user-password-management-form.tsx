import { KeyRound, LogOut, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-searchable';
import { Spinner } from '@/components/ui/spinner';
import { PasswordField } from '@/features/auth/components/password-field';
import { useUserPasswordManagement } from '../../hooks';
import { UserPasswordTargetSummary } from './user-password-target-summary';

export function UserPasswordManagementForm() {
  const form = useUserPasswordManagement();

  return (
    <form className="space-y-6" onSubmit={form.submit}>
      <div className="space-y-2">
        <Label htmlFor="password-user">User</Label>
        <Select value={form.userId} onValueChange={form.setUserId}>
          <SelectTrigger id="password-user" className="h-11">
            <SelectValue placeholder="Search and select a user" />
          </SelectTrigger>
          <SelectContent isLoading={form.isLoadingUsers} loadingText="Loading users...">
            {form.users.map((user) => (
              <SelectItem key={user.id} value={user.id}>
                <span className="flex min-w-0 items-center gap-2">
                  <UserRound className="size-4" />
                  <span className="truncate">
                    {user.fullname} · {user.email}
                  </span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {form.selectedUser ? <UserPasswordTargetSummary user={form.selectedUser} /> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <PasswordField
          id="managed-new-password"
          label="New password"
          value={form.password}
          onChange={(event) => form.setPassword(event.target.value)}
          minLength={8}
          maxLength={128}
          autoComplete="new-password"
          error={form.passwordError}
          required
        />
        <PasswordField
          id="managed-confirm-password"
          label="Confirm password"
          value={form.confirmPassword}
          onChange={(event) => form.setConfirmPassword(event.target.value)}
          minLength={8}
          maxLength={128}
          autoComplete="new-password"
          error={form.confirmationError}
          required
        />
      </div>

      <div className="flex gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
        <LogOut className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400" />
        <div className="text-sm">
          <p className="font-medium">The user will be signed out everywhere</p>
          <p className="text-muted-foreground mt-1">
            All active sessions are revoked immediately after the password is updated.
          </p>
        </div>
      </div>

      <Button type="submit" className="w-full gap-2 sm:w-auto" disabled={!form.canSubmit}>
        {form.isSaving ? <Spinner /> : <KeyRound className="size-4" />}
        {form.isSaving ? 'Updating password...' : 'Set new password'}
      </Button>
    </form>
  );
}
