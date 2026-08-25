import { Building2, Mail, ShieldCheck } from 'lucide-react';
import type { UserPasswordTarget } from '../../types';

export function UserPasswordTargetSummary({ user }: { user: UserPasswordTarget }) {
  return (
    <div className="bg-muted/40 grid gap-3 rounded-xl border p-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <p className="font-medium">{user.fullname}</p>
        <p className="text-muted-foreground mt-1 flex items-center gap-2 text-sm">
          <Mail className="size-4" /> {user.email}
        </p>
      </div>
      <p className="text-muted-foreground flex items-center gap-2 text-sm">
        <ShieldCheck className="size-4" /> {user.roleName ?? 'No role assigned'}
      </p>
      <p className="text-muted-foreground flex items-center gap-2 text-sm">
        <Building2 className="size-4" /> {user.branchName ?? 'No branch assigned'}
      </p>
    </div>
  );
}
