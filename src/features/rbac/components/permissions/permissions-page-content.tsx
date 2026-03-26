import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { PermissionCatalogUi } from '@/shared/permissions/constants';
import {
  useGetRolePermissionsQuery,
  useListRoleOptionsQuery,
  useSetRolePermissionsMutation,
} from '../../api/rbac.api';
import { useAuthStore } from '@/stores/auth-store';
import { toast } from 'sonner';

function groupByModule(items: Array<{ key: string; description: string; group: string }>) {
  const grouped = new Map<string, Array<{ key: string; description: string; group: string }>>();
  for (const item of items) {
    const group = grouped.get(item.group) ?? [];
    group.push(item);
    grouped.set(item.group, group);
  }
  return [...grouped.entries()];
}

export function PermissionsPageContent() {
  const authUser = useAuthStore((state) => state.user);
  const companyId = authUser?.company?.id ?? null;
  const [searchParams, setSearchParams] = useSearchParams();
  const [roleId, setRoleId] = useState(searchParams.get('roleId') ?? '');
  const [search, setSearch] = useState('');
  const [selectedPermissionKeys, setSelectedPermissionKeys] = useState<string[]>([]);

  const { data: roleOptionsData, isLoading: isLoadingRoles } = useListRoleOptionsQuery(
    { companyId, includeDeleted: false },
    { skip: !companyId },
  );
  const { data: rolePermissionsData, isLoading: isLoadingRolePermissions } =
    useGetRolePermissionsQuery(roleId, { skip: !roleId });
  const [setRolePermissions, { isLoading: isSavingPermissions }] = useSetRolePermissionsMutation();

  const filtered = useMemo(() => {
    const all = PermissionCatalogUi;
    const query = search.trim().toLowerCase();
    if (!query) return all;
    return all.filter(
      (permission) =>
        permission.key.toLowerCase().includes(query) ||
        permission.description.toLowerCase().includes(query) ||
        permission.group.toLowerCase().includes(query),
    );
  }, [search]);

  const grouped = useMemo(() => groupByModule(filtered), [filtered]);
  const allPermissionKeys = useMemo(
    () => PermissionCatalogUi.map((permission) => permission.key),
    [],
  );

  useEffect(() => {
    if (!rolePermissionsData) return;
    setSelectedPermissionKeys(rolePermissionsData.permissionKeys);
  }, [rolePermissionsData]);

  const roleOptions = roleOptionsData ?? [];

  const handleRoleChange = (nextRoleId: string) => {
    setRoleId(nextRoleId);
    const nextSearchParams = new URLSearchParams(searchParams);
    if (nextRoleId) nextSearchParams.set('roleId', nextRoleId);
    else nextSearchParams.delete('roleId');
    setSearchParams(nextSearchParams, { replace: true });
  };

  const handleTogglePermission = (key: string, enabled: boolean) => {
    setSelectedPermissionKeys((current) =>
      enabled
        ? current.includes(key)
          ? current
          : [...current, key]
        : current.filter((value) => value !== key),
    );
  };

  const handleSave = async () => {
    if (!roleId) {
      toast.error('Select a role first.');
      return;
    }
    try {
      await setRolePermissions({ roleId, permissionKeys: selectedPermissionKeys }).unwrap();
      toast.success('Role permissions updated');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update permissions');
    }
  };

  const handleReset = () => {
    setSelectedPermissionKeys(rolePermissionsData?.permissionKeys ?? []);
  };

  return (
    <div className="w-full p-4 space-y-4">
      <Card>
        <CardHeader className="space-y-3">
          <CardTitle>Role permissions</CardTitle>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="permission-role-select">Role</Label>
              <Select
                value={roleId || undefined}
                onValueChange={handleRoleChange}
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
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center justify-between rounded-md border p-3">
            <p className="text-sm text-muted-foreground">
              {selectedPermissionKeys.length} of {allPermissionKeys.length} selected
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedPermissionKeys(allPermissionKeys)}
                disabled={!roleId}
              >
                Check all
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedPermissionKeys([])}
                disabled={!roleId}
              >
                Clear all
              </Button>
              <Button size="sm" variant="outline" onClick={handleReset} disabled={!roleId}>
                Reset
              </Button>
              <Button size="sm" onClick={handleSave} disabled={!roleId || isSavingPermissions}>
                {isSavingPermissions ? 'Saving...' : 'Apply changes'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!roleId ? (
            <p className="text-sm text-muted-foreground">Select a role to manage permissions.</p>
          ) : isLoadingRolePermissions ? (
            <p className="text-sm text-muted-foreground">Loading role permissions...</p>
          ) : grouped.length === 0 ? (
            <p className="text-sm text-muted-foreground">No permissions found.</p>
          ) : (
            <div className="space-y-4">
              {grouped.map(([group, permissions]) => (
                <div key={group} className="space-y-2 rounded-md border p-3">
                  <h3 className="text-sm font-semibold">{group}</h3>
                  <div className="grid gap-2">
                    {permissions.map((permission) => (
                      <div
                        key={permission.key}
                        className="flex items-start justify-between gap-3 rounded border p-3 text-sm"
                      >
                        <div>
                          <div className="font-medium">{permission.key}</div>
                          <div className="text-muted-foreground">{permission.description}</div>
                        </div>
                        <Checkbox
                          checked={selectedPermissionKeys.includes(permission.key)}
                          onCheckedChange={(checked) =>
                            handleTogglePermission(permission.key, checked === true)
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
