import { getErrorMessage as getApplicationErrorMessage } from '@/lib/TheAduseiErrorResponse';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { PermissionCatalogUi, PermissionKeys } from '@/shared/permissions/constants';
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
import { PermissionsPageCardContent } from './permissions-page-card-content';
import { PermissionsPageCardHeader } from './permissions-page-card-header';
import { useAuthStore } from '@/stores/auth-store';
import { toast } from 'sonner';

export function PermissionsPageContent() {
  const authUser = useAuthStore((state) => state.user);
  const companyId = authUser?.company?.id ?? null;
  const canSetRolePermissions = authUser?.permissions?.includes(
    PermissionKeys.CanSetRolePermissions,
  );
  const [searchParams, setSearchParams] = useSearchParams();
  const [roleId, setRoleId] = useState(searchParams.get('roleId') ?? '');
  const [search, setSearch] = useState('');
  const [selectedPermissionKeys, setSelectedPermissionKeys] = useState<string[]>([]);
  const [activeMainTab, setActiveMainTab] = useState<MainPermissionTab>('Operations');
  const [activeSubdomain, setActiveSubdomain] = useState('');

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
        permission.domain.toLowerCase().includes(query) ||
        permission.subdomain.toLowerCase().includes(query) ||
        permission.module.toLowerCase().includes(query) ||
        permission.group.toLowerCase().includes(query),
    );
  }, [classifiedCatalog, search]);

  const byMainTab = useMemo(() => {
    const groups = new Map<MainPermissionTab, PermissionUiCatalogItem[]>();
    for (const tab of MAIN_PERMISSION_TABS) groups.set(tab, []);
    for (const permission of filtered) {
      const bucket = groups.get(permission.domain) ?? [];
      bucket.push(permission);
      groups.set(permission.domain, bucket);
    }
    return groups;
  }, [filtered]);

  const subdomainsInActiveTab = useMemo(() => {
    const permissions = byMainTab.get(activeMainTab) ?? [];
    const subdomainMap = new Map<string, PermissionUiCatalogItem[]>();
    for (const permission of permissions) {
      const list = subdomainMap.get(permission.subdomain) ?? [];
      list.push(permission);
      subdomainMap.set(permission.subdomain, list);
    }
    return [...subdomainMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([subdomain, permissions]) => ({
        subdomain,
        permissions: permissions.sort((a, b) => a.title.localeCompare(b.title)),
      }));
  }, [activeMainTab, byMainTab]);

  const modulesInActiveSubdomain = useMemo(() => {
    const activeSubdomainPermissions =
      subdomainsInActiveTab.find((entry) => entry.subdomain === activeSubdomain)?.permissions ?? [];
    const moduleMap = new Map<string, PermissionUiCatalogItem[]>();
    for (const permission of activeSubdomainPermissions) {
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
  }, [activeSubdomain, subdomainsInActiveTab]);

  const activeSubdomainPermissionCount = useMemo(
    () => modulesInActiveSubdomain.reduce((sum, module) => sum + module.permissions.length, 0),
    [modulesInActiveSubdomain],
  );

  const selectedPermissionKeySet = useMemo(
    () => new Set(selectedPermissionKeys),
    [selectedPermissionKeys],
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
        MAIN_PERMISSION_TABS.find((tab) => (byMainTab.get(tab) ?? []).length > 0) ?? 'Operations';
      setActiveMainTab(fallback);
      return;
    }
    if (!subdomainsInActiveTab.length) {
      setActiveSubdomain('');
      return;
    }
    const exists = subdomainsInActiveTab.some((entry) => entry.subdomain === activeSubdomain);
    if (!exists) {
      setActiveSubdomain(subdomainsInActiveTab[0]!.subdomain);
    }
  }, [activeMainTab, activeSubdomain, byMainTab, subdomainsInActiveTab]);

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

  const handleToggleModulePermissions = (
    permissions: PermissionUiCatalogItem[],
    enabled: boolean,
  ) => {
    if (!canSetRolePermissions) return;
    setSelectedPermissionKeys((current) => {
      const next = new Set(current);
      for (const permission of permissions) {
        if (enabled) next.add(permission.key);
        else next.delete(permission.key);
      }
      return [...next];
    });
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
      toast.error(getApplicationErrorMessage(error, '') || 'Failed to update permissions');
    }
  };

  const handleReset = () => {
    setSelectedPermissionKeys(rolePermissionsData?.permissionKeys ?? []);
  };

  return (
    <div className="w-full p-4 space-y-4">
      <Card>
        <PermissionsPageCardHeader
          roleId={roleId}
          search={search}
          roleOptions={roleOptions}
          isLoadingRoles={isLoadingRoles}
          canSetRolePermissions={canSetRolePermissions}
          isSavingPermissions={isSavingPermissions}
          allPermissionCount={allPermissionKeys.length}
          selectedPermissionCount={selectedPermissionKeys.length}
          onRoleChange={handleRoleChange}
          onSearchChange={setSearch}
          onApply={handleSave}
          onCheckAll={() => setSelectedPermissionKeys(allPermissionKeys)}
          onClearAll={() => setSelectedPermissionKeys([])}
          onReset={handleReset}
        />
        <PermissionsPageCardContent
          roleId={roleId}
          isLoadingRolePermissions={isLoadingRolePermissions}
          filteredLength={filtered.length}
          activeMainTab={activeMainTab}
          activeSubdomain={activeSubdomain}
          byMainTab={byMainTab}
          subdomainsInActiveTab={subdomainsInActiveTab}
          modulesInActiveSubdomain={modulesInActiveSubdomain}
          activeSubdomainPermissionCount={activeSubdomainPermissionCount}
          canSetRolePermissions={canSetRolePermissions}
          selectedPermissionKeySet={selectedPermissionKeySet}
          onMainTabChange={setActiveMainTab}
          onSelectSubdomain={setActiveSubdomain}
          onTogglePermission={handleTogglePermission}
          onToggleModulePermissions={handleToggleModulePermissions}
        />
      </Card>
    </div>
  );
}
