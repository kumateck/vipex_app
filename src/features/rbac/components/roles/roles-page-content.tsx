import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { DataTable } from '@/components/datatable';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BranchType } from '@/db/schemas/enums';
import { PermissionKeys } from '@/shared/permissions/constants';
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

const ACCOUNTING_PERMISSION_PRESETS = [
  {
    key: 'accounting-viewer',
    label: 'Accounting Viewer',
    description: 'Reports and accounting reads only',
    permissionKeys: [PermissionKeys.CanReadAccounting],
  },
  {
    key: 'accounting-setup',
    label: 'Accounting Setup Admin',
    description: 'Manage chart, categories, bank, policies, and tax setup',
    permissionKeys: [PermissionKeys.CanReadAccounting, PermissionKeys.CanManageAccountingSetup],
  },
  {
    key: 'accounting-tax',
    label: 'Tax Filing Officer',
    description: 'Manage tax filing periods and filing actions',
    permissionKeys: [PermissionKeys.CanReadAccounting, PermissionKeys.CanManageTaxFiling],
  },
  {
    key: 'accounting-operations',
    label: 'Accounting Operations',
    description: 'Daily cash and expense workflow posting',
    permissionKeys: [PermissionKeys.CanReadAccounting, PermissionKeys.CanPostAccountingEntries],
  },
  {
    key: 'accounting-full',
    label: 'Accounting Full Access',
    description: 'Full accounting setup, tax, and posting access',
    permissionKeys: [
      PermissionKeys.CanReadAccounting,
      PermissionKeys.CanManageAccountingSetup,
      PermissionKeys.CanManageTaxFiling,
      PermissionKeys.CanPostAccountingEntries,
      PermissionKeys.CanComputeTaxes,
    ],
  },
] as const;

const OPERATIONS_PERMISSION_PRESETS = [
  {
    key: 'warehouse-viewer',
    label: 'Warehouse Viewer',
    description: 'View warehouse records only',
    permissionKeys: [PermissionKeys.CanReadWarehouses],
  },
  {
    key: 'warehouse-manager',
    label: 'Warehouse Manager',
    description: 'Create, update, and retire warehouses',
    permissionKeys: [
      PermissionKeys.CanReadWarehouses,
      PermissionKeys.CanCreateWarehouses,
      PermissionKeys.CanUpdateWarehouses,
      PermissionKeys.CanDeleteWarehouses,
    ],
  },
  {
    key: 'internal-transfer-clerk',
    label: 'Internal Transfer Clerk',
    description: 'Create and view internal parcel transfers',
    permissionKeys: [
      PermissionKeys.CanReadParcelInternalTransfers,
      PermissionKeys.CanCreateParcelInternalTransfers,
    ],
  },
  {
    key: 'internal-transfer-receiver',
    label: 'Transfer Acknowledgement Officer',
    description: 'Acknowledge or cancel internal parcel transfers',
    permissionKeys: [
      PermissionKeys.CanReadParcelInternalTransfers,
      PermissionKeys.CanAcknowledgeParcelInternalTransfers,
      PermissionKeys.CanCancelParcelInternalTransfers,
    ],
  },
  {
    key: 'internal-transfer-full',
    label: 'Internal Transfer Full Access',
    description: 'Full warehouse and parcel internal transfer operations',
    permissionKeys: [
      PermissionKeys.CanReadWarehouses,
      PermissionKeys.CanCreateWarehouses,
      PermissionKeys.CanUpdateWarehouses,
      PermissionKeys.CanDeleteWarehouses,
      PermissionKeys.CanReadParcelInternalTransfers,
      PermissionKeys.CanCreateParcelInternalTransfers,
      PermissionKeys.CanAcknowledgeParcelInternalTransfers,
      PermissionKeys.CanCancelParcelInternalTransfers,
    ],
  },
] as const;

const ROLE_PERMISSION_PRESETS = [
  ...ACCOUNTING_PERMISSION_PRESETS,
  ...OPERATIONS_PERMISSION_PRESETS,
] as const;

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
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
  const [roleNameInput, setRoleNameInput] = useState('');
  const [selectedPermissionKeys, setSelectedPermissionKeys] = useState<string[]>([]);
  const [createMode, setCreateMode] = useState<'blank' | 'duplicate'>('blank');
  const [duplicateRoleId, setDuplicateRoleId] = useState('');

  const { data: rolesData, isLoading: isLoadingRoles } = useListRolesQuery(query, {
    skip: !companyId,
  });
  const { data: roleOptionsData, isLoading: isLoadingRoleOptions } = useListRoleOptionsQuery(
    { companyId, includeDeleted: false },
    { skip: !companyId },
  );
  const { data: permissionCatalogData, isLoading: isLoadingPermissions } =
    useListPermissionCatalogQuery(undefined, {
      skip: !companyId,
    });
  const { data: duplicateRolePermissionsData, isFetching: isLoadingDuplicatePermissions } =
    useGetRolePermissionsQuery(duplicateRoleId, {
      skip: createMode !== 'duplicate' || !duplicateRoleId,
    });

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

  const handleRequestChange = useCallback(
    (request: ServerListQuery<{ companyId: string | null }>) => {
      setQuery(request);
    },
    [],
  );

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
      checked
        ? current.includes(key)
          ? current
          : [...current, key]
        : current.filter((value) => value !== key),
    );
  };

  const applyPermissionPreset = (permissionKeys: string[]) => {
    setSelectedPermissionKeys((current) => Array.from(new Set([...current, ...permissionKeys])));
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
    try {
      await deleteRole(role.id).unwrap();
      toast.success('Role deleted');
      setRoleToDelete(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete role');
    }
  };

  const handleSavePermissions = async () => {
    if (!selectedRole) return;
    try {
      await setRolePermissions({
        roleId: selectedRole.id,
        permissionKeys: selectedPermissionKeys,
      }).unwrap();
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
        onDelete: setRoleToDelete,
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
        permissionPresets={ROLE_PERMISSION_PRESETS.map((preset) => ({
          ...preset,
          onApply: () => applyPermissionPreset([...preset.permissionKeys]),
        }))}
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
        permissionPresets={ROLE_PERMISSION_PRESETS.map((preset) => ({
          ...preset,
          onApply: () => applyPermissionPreset([...preset.permissionKeys]),
        }))}
        onSelectAll={() => setSelectedPermissionKeys(allPermissionKeys)}
        onClearAll={() => setSelectedPermissionKeys([])}
        submitting={isSavingPermissions}
        onSubmit={handleSavePermissions}
      />

      <AlertDialog
        open={Boolean(roleToDelete)}
        onOpenChange={(open) => (!open ? setRoleToDelete(null) : null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete role?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove {roleToDelete ? `"${roleToDelete.name}"` : 'this role'}.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (!roleToDelete) return;
                void handleDeleteRole(roleToDelete);
              }}
            >
              Delete role
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
