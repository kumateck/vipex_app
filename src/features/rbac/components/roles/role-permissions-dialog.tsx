import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { PermissionCatalogItem } from '../../api/rbac.api';

interface RolePermissionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roleName?: string;
  selectedPermissionKeys: string[];
  groupedPermissionCatalog: Array<[string, PermissionCatalogItem[]]>;
  allPermissionKeys: string[];
  onTogglePermission: (key: string, checked: boolean) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
  submitting: boolean;
  onSubmit: () => void;
}

export function RolePermissionsDialog({
  open,
  onOpenChange,
  roleName,
  selectedPermissionKeys,
  groupedPermissionCatalog,
  allPermissionKeys,
  onTogglePermission,
  onSelectAll,
  onClearAll,
  submitting,
  onSubmit,
}: RolePermissionsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl">
        <DialogHeader>
          <DialogTitle>Manage permissions: {roleName ?? ''}</DialogTitle>
        </DialogHeader>
        <div className="flex items-center justify-between rounded-md border p-3">
          <p className="text-sm text-muted-foreground">
            {selectedPermissionKeys.length} of {allPermissionKeys.length} selected
          </p>
          <div className="flex gap-2">
            <Button type="button" size="sm" variant="outline" onClick={onSelectAll}>
              Check all
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={onClearAll}>
              Clear all
            </Button>
          </div>
        </div>
        <div className="max-h-[520px] overflow-auto space-y-4 rounded-md border p-3">
          {groupedPermissionCatalog.map(([group, items]) => (
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
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={submitting}>
            Save permissions
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
