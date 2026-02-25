import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import type { PermissionCatalogItem } from '../../api/rbac.api';

interface RoleCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roleName: string;
  onRoleNameChange: (value: string) => void;
  selectedPermissionKeys: string[];
  onTogglePermission: (key: string, checked: boolean) => void;
  groupedPermissionCatalog: Array<[string, PermissionCatalogItem[]]>;
  loadingPermissions: boolean;
  submitting: boolean;
  onSubmit: () => void;
}

export function RoleCreateDialog({
  open,
  onOpenChange,
  roleName,
  onRoleNameChange,
  selectedPermissionKeys,
  onTogglePermission,
  groupedPermissionCatalog,
  loadingPermissions,
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
          <Input placeholder="Role name" value={roleName} onChange={(event) => onRoleNameChange(event.target.value)} />
          <div className="max-h-[360px] overflow-auto space-y-4 rounded-md border p-3">
            {loadingPermissions ? (
              <p className="text-sm text-muted-foreground">Loading permissions...</p>
            ) : (
              groupedPermissionCatalog.map(([group, items]) => (
                <div key={group} className="space-y-2">
                  <p className="text-sm font-medium">{group}</p>
                  <div className="grid gap-2 md:grid-cols-2">
                    {items.map((item) => (
                      <label key={item.key} className="flex items-start gap-2 rounded border p-2">
                        <Checkbox
                          checked={selectedPermissionKeys.includes(item.key)}
                          onCheckedChange={(value) => onTogglePermission(item.key, value === true)}
                        />
                        <span className="text-sm">
                          <span className="block font-medium">{item.key}</span>
                          <span className="text-muted-foreground">{item.description}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
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
