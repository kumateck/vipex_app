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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { PermissionCatalogUi } from '@/shared/permissions/constants';
import { cn } from '@/lib/utils';
import {
  MAIN_PERMISSION_TABS,
  type MainPermissionTab,
  PermissionUiCatalog,
  type PermissionUiCatalogItem,
} from '@/shared/permissions/ui-metadata';
import {
  useGetRolePermissionsQuery,
  useListRoleOptionsQuery,
  useSetRolePermissionsMutation,
} from '../../api/rbac.api';
import { useAuthStore } from '@/stores/auth-store';
import { toast } from 'sonner';

export function PermissionsPageContent() {
  const authUser = useAuthStore((state) => state.user);
  const companyId = authUser?.company?.id ?? null;
  const canSetRolePermissions = authUser?.permissions?.includes('CanSetRolePermissions');
  const [searchParams, setSearchParams] = useSearchParams();
  const [roleId, setRoleId] = useState(searchParams.get('roleId') ?? '');
  const [search, setSearch] = useState('');
  const [selectedPermissionKeys, setSelectedPermissionKeys] = useState<string[]>([]);
  const [activeMainTab, setActiveMainTab] = useState<MainPermissionTab>('Main');
  const [activeModule, setActiveModule] = useState('');

  const { data: roleOptionsData, isLoading: isLoadingRoles } = useListRoleOptionsQuery(
    { companyId, includeDeleted: false },
    { skip: !companyId },
  );
  const { data: rolePermissionsData, isLoading: isLoadingRolePermissions } =
    useGetRolePermissionsQuery(roleId, { skip: !roleId });
  const [setRolePermissions, { isLoading: isSavingPermissions }] = useSetRolePermissionsMutation();

  const classifiedCatalog = useMemo(() => PermissionUiCatalog, []);

  const filtered = useMemo(() => {
    const all = classifiedCatalog;
    const query = search.trim().toLowerCase();
    if (!query) return all;
    return all.filter(
      (permission) =>
        permission.key.toLowerCase().includes(query) ||
        permission.title.toLowerCase().includes(query) ||
        permission.description.toLowerCase().includes(query) ||
        permission.mainTab.toLowerCase().includes(query) ||
        permission.module.toLowerCase().includes(query),
    );
  }, [classifiedCatalog, search]);

  const byMainTab = useMemo(() => {
    const groups = new Map<MainPermissionTab, PermissionUiCatalogItem[]>();
    for (const tab of MAIN_PERMISSION_TABS) groups.set(tab, []);
    for (const permission of filtered) {
      const bucket = groups.get(permission.mainTab) ?? [];
      bucket.push(permission);
      groups.set(permission.mainTab, bucket);
    }
    return groups;
  }, [filtered]);

  const modulesInActiveTab = useMemo(() => {
    const permissions = byMainTab.get(activeMainTab) ?? [];
    const moduleMap = new Map<string, PermissionUiCatalogItem[]>();
    for (const permission of permissions) {
      const list = moduleMap.get(permission.module) ?? [];
      list.push(permission);
      moduleMap.set(permission.module, list);
    }
    return [...moduleMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([module, permissions]) => ({
        module,
        permissions: permissions.sort((a, b) => a.title.localeCompare(b.title)),
      }));
  }, [activeMainTab, byMainTab]);

  const activeModulePermissions = useMemo(
    () => modulesInActiveTab.find((entry) => entry.module === activeModule)?.permissions ?? [],
    [activeModule, modulesInActiveTab],
  );

  const allPermissionKeys = useMemo(
    () => PermissionCatalogUi.map((permission) => permission.key),
    [],
  );

  useEffect(() => {
    if (!rolePermissionsData) return;
    setSelectedPermissionKeys(rolePermissionsData.permissionKeys);
  }, [rolePermissionsData]);

  useEffect(() => {
    const hasAnyInTab = (byMainTab.get(activeMainTab) ?? []).length > 0;
    if (!hasAnyInTab) {
      const fallback =
        MAIN_PERMISSION_TABS.find((tab) => (byMainTab.get(tab) ?? []).length > 0) ?? 'Main';
      setActiveMainTab(fallback);
      return;
    }
    if (!modulesInActiveTab.length) {
      setActiveModule('');
      return;
    }
    const exists = modulesInActiveTab.some((entry) => entry.module === activeModule);
    if (!exists) {
      setActiveModule(modulesInActiveTab[0]!.module);
    }
  }, [activeMainTab, activeModule, byMainTab, modulesInActiveTab]);

  const roleOptions = roleOptionsData ?? [];

  const handleRoleChange = (nextRoleId: string) => {
    setRoleId(nextRoleId);
    const nextSearchParams = new URLSearchParams(searchParams);
    if (nextRoleId) nextSearchParams.set('roleId', nextRoleId);
    else nextSearchParams.delete('roleId');
    setSearchParams(nextSearchParams, { replace: true });
  };

  const handleTogglePermission = (key: string, enabled: boolean) => {
    if (!canSetRolePermissions) return;
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
                disabled={!roleId || !canSetRolePermissions}
              >
                Check all
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedPermissionKeys([])}
                disabled={!roleId || !canSetRolePermissions}
              >
                Clear all
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleReset}
                disabled={!roleId || !canSetRolePermissions}
              >
                Reset
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
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
        </CardHeader>
        <CardContent>
          {!roleId ? (
            <p className="text-sm text-muted-foreground">Select a role to manage permissions.</p>
          ) : isLoadingRolePermissions ? (
            <p className="text-sm text-muted-foreground">Loading role permissions...</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">No permissions found.</p>
          ) : (
            <Tabs
              value={activeMainTab}
              onValueChange={(value) => setActiveMainTab(value as MainPermissionTab)}
              className="space-y-4"
            >
              <TabsList className="flex h-auto w-full flex-wrap justify-start gap-2">
                {MAIN_PERMISSION_TABS.map((tab) => (
                  <TabsTrigger key={tab} value={tab}>
                    {tab}
                  </TabsTrigger>
                ))}
              </TabsList>

              {MAIN_PERMISSION_TABS.map((tab) => (
                <TabsContent key={tab} value={tab}>
                  {(byMainTab.get(tab) ?? []).length === 0 ? (
                    <div className="rounded-md border p-3 text-sm text-muted-foreground">
                      No permissions in this section.
                    </div>
                  ) : (
                    <div className="grid gap-3 rounded-md border p-3 md:grid-cols-[240px_1fr]">
                      <div className="border-r pr-3">
                        <h3 className="mb-2 text-sm font-semibold">{tab} Modules</h3>
                        <ScrollableWrapper>
                          <div className="space-y-2 pr-1">
                            {modulesInActiveTab.map((entry) => (
                              <button
                                key={entry.module}
                                type="button"
                                onClick={() => setActiveModule(entry.module)}
                                className={cn(
                                  'w-full rounded-md border px-3 py-2 text-left text-sm transition-colors',
                                  activeModule === entry.module
                                    ? 'border-primary bg-primary/10 text-primary'
                                    : 'hover:bg-muted',
                                )}
                              >
                                <div className="font-medium">{entry.module}</div>
                                <div className="text-xs text-muted-foreground">
                                  {entry.permissions.length} permissions
                                </div>
                              </button>
                            ))}
                          </div>
                        </ScrollableWrapper>
                      </div>

                      <div>
                        <h3 className="mb-2 text-sm font-semibold">
                          {activeModule || 'Permissions'}
                        </h3>
                        <ScrollableWrapper>
                          <div className="space-y-2 pr-1">
                            {activeModulePermissions.map((permission) => (
                              <div
                                key={permission.key}
                                className="flex items-start justify-between gap-3 rounded border p-3 text-sm"
                              >
                                <div>
                                  <div className="font-medium">{permission.title}</div>
                                  <div className="text-muted-foreground">
                                    {permission.description} [{permission.mainTab} /{' '}
                                    {permission.module}]
                                  </div>
                                  <div className="font-mono text-xs text-muted-foreground/80">
                                    {permission.key}
                                  </div>
                                </div>
                                <Checkbox
                                  checked={selectedPermissionKeys.includes(permission.key)}
                                  onCheckedChange={(checked) =>
                                    handleTogglePermission(permission.key, checked === true)
                                  }
                                  disabled={!canSetRolePermissions}
                                />
                              </div>
                            ))}
                          </div>
                        </ScrollableWrapper>
                      </div>
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
