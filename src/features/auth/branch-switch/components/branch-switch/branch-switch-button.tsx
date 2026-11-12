import { useState } from 'react';
import { Building2, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { useHasPermission } from '@/components/permissions/permission-guard';
import { PermissionKeys } from '@/shared/permissions/constants';
import { useAuthStore } from '@/stores/auth-store';
import { BranchSwitchDialog } from '../../dialogs/branch-switch-dialog';

export function BranchSwitchButton() {
  const canSwitch = useHasPermission(PermissionKeys.CanSwitchBranch);
  const branch = useAuthStore((state) => state.user?.branch?.name);
  const [open, setOpen] = useState(false);
  if (!canSwitch || !branch) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" aria-label={`Switch branch, current branch ${branch}`}>
          <Building2 />
          <span className="hidden max-w-40 truncate sm:inline">{branch}</span>
          <ChevronDown className="hidden sm:block" />
        </Button>
      </DialogTrigger>
      {open ? <BranchSwitchDialog /> : null}
    </Dialog>
  );
}
