import { CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-searchable';
import { PermissionSelectionToolbar } from './permission-selection-toolbar';

type RoleOption = { id: string; name: string };

type PermissionsPageCardHeaderProps = {
  roleId: string;
  search: string;
  roleOptions: RoleOption[];
  isLoadingRoles: boolean;
  canSetRolePermissions: boolean | undefined;
  isSavingPermissions: boolean;
  allPermissionCount: number;
  selectedPermissionCount: number;
  onRoleChange: (nextRoleId: string) => void;
  onSearchChange: (value: string) => void;
  onApply: () => Promise<void>;
  onCheckAll: () => void;
  onClearAll: () => void;
  onReset: () => void;
};

export function PermissionsPageCardHeader({
  roleId,
  search,
  roleOptions,
  isLoadingRoles,
  canSetRolePermissions,
  isSavingPermissions,
  allPermissionCount,
  selectedPermissionCount,
  onRoleChange,
  onSearchChange,
  onApply,
  onCheckAll,
  onClearAll,
  onReset,
}: PermissionsPageCardHeaderProps) {
  return (
    <CardHeader className="space-y-3">
      <CardTitle>Role permissions</CardTitle>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="permission-role-select">Role</Label>
          <Select
            value={roleId || undefined}
            onValueChange={onRoleChange}
            disabled={isLoadingRoles || roleOptions.length === 0}
          >
            <SelectTrigger id="permission-role-select">
              <SelectValue placeholder={isLoadingRoles ? 'Loading roles...' : 'Select role'} />
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
        <div className="space-y-2">
          <Label htmlFor="permission-search">Search permissions</Label>
          <Input
            id="permission-search"
            placeholder="Search permissions..."
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </div>
      </div>
      <PermissionSelectionToolbar
        allPermissionCount={allPermissionCount}
        canSetRolePermissions={canSetRolePermissions}
        isSavingPermissions={isSavingPermissions}
        roleId={roleId}
        selectedPermissionCount={selectedPermissionCount}
        onApply={onApply}
        onCheckAll={onCheckAll}
        onClearAll={onClearAll}
        onReset={onReset}
      />
    </CardHeader>
  );
}
