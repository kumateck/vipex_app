import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { DataTable } from '@/components/datatable';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BranchType } from '@/db/schemas/enums';
import type { PaginationMeta } from '@/server/types/pagination.types';
import type { ServerListQuery } from '@/services/rtk-query';
import { useAuthStore } from '@/stores/auth-store';
import {
  type Role,
  useGetRolePermissionsQuery,
  useCreateRoleMutation,
  useDeleteRoleMutation,
  useListPermissionCatalogQuery,
  useListRoleOptionsQuery,
  useListRolesQuery,
  useSetRolePermissionsMutation,
  useUpdateRoleMutation,
} from '../../api/rbac.api';
import { createRoleColumns } from '../role-columns';
import { RoleCreateDialog } from './role-create-dialog';
import { RolePermissionsDialog } from './role-permissions-dialog';
import { RoleRenameDialog } from './role-rename-dialog';
import { groupPermissions } from './roles-utils';

const EMPTY_META: PaginationMeta = {
  totalRecords: 0,
  totalPages: 1,
  page: 1,
  pageSize: 20,
  hasNextPage: false,
  hasPreviousPage: false,
};

export function RolesPageContent() {
  const authUser = useAuthStore((state) => state.user);
  const companyId = authUser?.company?.id ?? null;
  const canManageRoles = authUser?.branch?.type === BranchType.HEADOFFICE;
  const [query, setQuery] = useState<ServerListQuery<{ companyId: string | null }>>({
    page: 1,
    pageSize: 20,
    filters: { companyId },
  });

  const [createRole, { isLoading: isCreatingRole }] = useCreateRoleMutation();
  const [updateRole, { isLoading: isUpdatingRole }] = useUpdateRoleMutation();
  const [deleteRole] = useDeleteRoleMutation();
  const [setRolePermissions, { isLoading: isSavingPermissions }] = useSetRolePermissionsMutation();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [isPermissionsOpen, setIsPermissionsOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [roleNameInput, setRoleNameInput] = useState('');
  const [selectedPermissionKeys, setSelectedPermissionKeys] = useState<string[]>([]);
  const [createMode, setCreateMode] = useState<'blank' | 'duplicate'>('blank');
  const [duplicateRoleId, setDuplicateRoleId] = useState('');

  const { data: rolesData, isLoading: isLoadingRoles } = useListRolesQuery(query, { skip: !companyId });
  const { data: roleOptionsData, isLoading: isLoadingRoleOptions } = useListRoleOptionsQuery(
    { companyId, includeDeleted: false },
    { skip: !companyId },
  );
  const { data: permissionCatalogData, isLoading: isLoadingPermissions } = useListPermissionCatalogQuery(undefined, {
    skip: !companyId,
  });
  const { data: duplicateRolePermissionsData, isFetching: isLoadingDuplicatePermissions } = useGetRolePermissionsQuery(
    duplicateRoleId,
    { skip: createMode !== 'duplicate' || !duplicateRoleId },
  );

  const allPermissionKeys = useMemo(
    () => (permissionCatalogData?.data ?? []).map((permission) => permission.key),
    [permissionCatalogData],
  );
  const groupedPermissionCatalog = useMemo(
    () => groupPermissions(permissionCatalogData?.data ?? []),
    [permissionCatalogData],
  );
  const roleOptions = roleOptionsData ?? [];
  const duplicateRoleName = useMemo(
    () => roleOptions.find((role) => role.id === duplicateRoleId)?.name ?? '',
    [duplicateRoleId, roleOptions],
  );

  const handleRequestChange = useCallback((request: ServerListQuery<{ companyId: string | null }>) => {
    setQuery(request);
  }, []);

  const openCreateDialog = () => {
    setSelectedRole(null);
    setCreateMode('blank');
    setDuplicateRoleId('');
    setRoleNameInput('');
    setSelectedPermissionKeys([]);
    setIsCreateOpen(true);
  };

  useEffect(() => {
    if (!isCreateOpen) return;
    if (createMode === 'blank') {
      setSelectedPermissionKeys([]);
      return;
    }
    if (!duplicateRoleId) {
      setSelectedPermissionKeys([]);
      return;
    }
    if (!duplicateRolePermissionsData) return;
    setSelectedPermissionKeys(duplicateRolePermissionsData.permissionKeys);
  }, [createMode, duplicateRoleId, duplicateRolePermissionsData, isCreateOpen]);

  useEffect(() => {
    if (createMode !== 'duplicate') return;
    if (!duplicateRoleName) return;
    setRoleNameInput((current) => (current.trim().length ? current : `${duplicateRoleName} copy`));
  }, [createMode, duplicateRoleName]);

  const openRenameDialog = (role: Role) => {
    setSelectedRole(role);
    setRoleNameInput(role.name);
    setIsRenameOpen(true);
  };

  const openPermissionsDialog = (role: Role) => {
    setSelectedRole(role);
    setSelectedPermissionKeys(role.permissions);
    setIsPermissionsOpen(true);
  };

  const handleTogglePermission = (key: string, checked: boolean) => {
    setSelectedPermissionKeys((current) =>
      checked ? (current.includes(key) ? current : [...current, key]) : current.filter((value) => value !== key),
    );
  };

  const handleCreateRole = async () => {
    const name = roleNameInput.trim();
    if (!name) return toast.error('Role name is required');

    try {
      await createRole({ name, permissionKeys: selectedPermissionKeys }).unwrap();
      toast.success('Role created');
      setIsCreateOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create role');
    }
  };

  const handleRenameRole = async () => {
    if (!selectedRole) return;
    const name = roleNameInput.trim();
    if (!name) return toast.error('Role name is required');

    try {
      await updateRole({ id: selectedRole.id, name }).unwrap();
      toast.success('Role updated');
      setIsRenameOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update role');
    }
  };

  const handleDeleteRole = async (role: Role) => {
    if (!window.confirm(`Delete role "${role.name}"?`)) return;
    try {
      await deleteRole(role.id).unwrap();
      toast.success('Role deleted');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete role');
    }
  };

  const handleSavePermissions = async () => {
    if (!selectedRole) return;
    try {
      await setRolePermissions({ roleId: selectedRole.id, permissionKeys: selectedPermissionKeys }).unwrap();
      toast.success('Role permissions updated');
      setIsPermissionsOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update permissions');
    }
  };

  const columns = useMemo(
    () =>
      createRoleColumns({
        onRename: openRenameDialog,
        onManagePermissions: openPermissionsDialog,
        onDelete: handleDeleteRole,
        canManage: canManageRoles,
      }),
    [canManageRoles],
  );

  return (
    <div className="w-full p-4 space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Roles</CardTitle>
          {canManageRoles ? <Button onClick={openCreateDialog}>New role</Button> : null}
        </CardHeader>
        <CardContent>
          <DataTable
            mode="server"
            data={rolesData?.data ?? []}
            columns={columns}
            meta={rolesData?.meta ?? EMPTY_META}
            loading={isLoadingRoles}
            serverFilters={{ companyId }}
            onRequestChange={handleRequestChange}
            searchPlaceholder="Search roles..."
            enableVirtualization={false}
          />
        </CardContent>
      </Card>

      <RoleCreateDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        createMode={createMode}
        onCreateModeChange={setCreateMode}
        duplicateRoleId={duplicateRoleId}
        onDuplicateRoleIdChange={setDuplicateRoleId}
        roleOptions={roleOptions}
        loadingRoleOptions={isLoadingRoleOptions}
        loadingDuplicatePermissions={isLoadingDuplicatePermissions}
        roleName={roleNameInput}
        onRoleNameChange={setRoleNameInput}
        selectedPermissionKeys={selectedPermissionKeys}
        onTogglePermission={handleTogglePermission}
        groupedPermissionCatalog={groupedPermissionCatalog}
        loadingPermissions={isLoadingPermissions}
        submitting={isCreatingRole}
        onSubmit={handleCreateRole}
      />

      <RoleRenameDialog
        open={isRenameOpen}
        onOpenChange={setIsRenameOpen}
        roleName={roleNameInput}
        onRoleNameChange={setRoleNameInput}
        submitting={isUpdatingRole}
        onSubmit={handleRenameRole}
      />

      <RolePermissionsDialog
        open={isPermissionsOpen}
        onOpenChange={setIsPermissionsOpen}
        roleName={selectedRole?.name}
        selectedPermissionKeys={selectedPermissionKeys}
        groupedPermissionCatalog={groupedPermissionCatalog}
        allPermissionKeys={allPermissionKeys}
        onTogglePermission={handleTogglePermission}
        onSelectAll={() => setSelectedPermissionKeys(allPermissionKeys)}
        onClearAll={() => setSelectedPermissionKeys([])}
        submitting={isSavingPermissions}
        onSubmit={handleSavePermissions}
      />
    </div>
  );
}
