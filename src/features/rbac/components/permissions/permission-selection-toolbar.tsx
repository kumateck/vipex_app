import { Button } from '@/components/ui/button';

type PermissionSelectionToolbarProps = {
  allPermissionCount: number;
  canSetRolePermissions: boolean | undefined;
  isSavingPermissions: boolean;
  roleId: string;
  selectedPermissionCount: number;
  onApply: () => void;
  onCheckAll: () => void;
  onClearAll: () => void;
  onReset: () => void;
};

export function PermissionSelectionToolbar({
  allPermissionCount,
  canSetRolePermissions,
  isSavingPermissions,
  roleId,
  selectedPermissionCount,
  onApply,
  onCheckAll,
  onClearAll,
  onReset,
}: PermissionSelectionToolbarProps) {
  return (
    <>
      <div className="flex items-center justify-between rounded-md border p-3">
        <p className="text-sm text-muted-foreground">
          {selectedPermissionCount} of {allPermissionCount} selected
        </p>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={onCheckAll}
            disabled={!roleId || !canSetRolePermissions}
          >
            Check all
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onClearAll}
            disabled={!roleId || !canSetRolePermissions}
          >
            Clear all
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onReset}
            disabled={!roleId || !canSetRolePermissions}
          >
            Reset
          </Button>
          <Button
            size="sm"
            onClick={onApply}
            disabled={!roleId || isSavingPermissions || !canSetRolePermissions}
          >
            {isSavingPermissions ? 'Saving...' : 'Apply changes'}
          </Button>
        </div>
      </div>
      {!canSetRolePermissions ? (
        <p className="text-sm text-muted-foreground">
          You can view permissions, but your role cannot modify role permissions.
        </p>
      ) : null}
    </>
  );
}
