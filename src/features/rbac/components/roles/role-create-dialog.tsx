import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { RoleOption } from '../../api/rbac.api';

interface RoleCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  createMode: 'blank' | 'duplicate';
  onCreateModeChange: (mode: 'blank' | 'duplicate') => void;
  duplicateRoleId: string;
  onDuplicateRoleIdChange: (roleId: string) => void;
  roleOptions: RoleOption[];
  loadingRoleOptions: boolean;
  loadingDuplicatePermissions: boolean;
  roleName: string;
  onRoleNameChange: (value: string) => void;
  submitting: boolean;
  onSubmit: () => void;
}

export function RoleCreateDialog({
  open,
  onOpenChange,
  createMode,
  onCreateModeChange,
  duplicateRoleId,
  onDuplicateRoleIdChange,
  roleOptions,
  loadingRoleOptions,
  loadingDuplicatePermissions,
  roleName,
  onRoleNameChange,
  submitting,
  onSubmit,
}: RoleCreateDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create role</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <p className="text-sm font-medium">How to start</p>
              <Select
                value={createMode}
                onValueChange={(value) => onCreateModeChange(value as 'blank' | 'duplicate')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="blank">Create fresh role</SelectItem>
                  <SelectItem value="duplicate">Duplicate existing role</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {createMode === 'duplicate' ? (
              <div className="space-y-2">
                <p className="text-sm font-medium">Source role</p>
                <Select
                  value={duplicateRoleId || undefined}
                  onValueChange={onDuplicateRoleIdChange}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        loadingRoleOptions ? 'Loading roles...' : 'Select role to duplicate'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {roleOptions.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
          </div>

          <Input
            placeholder="Role name"
            value={roleName}
            onChange={(event) => onRoleNameChange(event.target.value)}
          />
          {createMode === 'duplicate' && duplicateRoleId ? (
            <p className="text-xs text-muted-foreground">
              {loadingDuplicatePermissions
                ? 'Preparing selected role details...'
                : 'You are creating a new role based on the selected role name.'}
            </p>
          ) : null}
          <p className="text-xs text-muted-foreground">
            Permission assignment is now managed on the dedicated Permissions page.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={submitting}>
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
