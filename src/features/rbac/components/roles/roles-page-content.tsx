import { getErrorMessage as getApplicationErrorMessage } from '@/lib/TheAduseiErrorResponse';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  useCreateRoleMutation,
  useDeleteRoleMutation,
  useListRoleOptionsQuery,
  useListRolesQuery,
  useUpdateRoleMutation,
} from '../../api/rbac.api';
import { createRoleColumns } from '../role-columns';
import { RoleCreateDialog } from './role-create-dialog';
import { RoleRenameDialog } from './role-rename-dialog';
import { RolesDeleteDialog } from './roles-delete-dialog';

const EMPTY_META: PaginationMeta = {
  totalRecords: 0,
  totalPages: 1,
  page: 1,
  pageSize: 20,
  hasNextPage: false,
  hasPreviousPage: false,
};

export function RolesPageContent() {
  const navigate = useNavigate();
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
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
  const [roleNameInput, setRoleNameInput] = useState('');
  const [createMode, setCreateMode] = useState<'blank' | 'duplicate'>('blank');
  const [duplicateRoleId, setDuplicateRoleId] = useState('');

  const { data: rolesData, isLoading: isLoadingRoles } = useListRolesQuery(query, {
    skip: !companyId,
  });
  const { data: roleOptionsData, isLoading: isLoadingRoleOptions } = useListRoleOptionsQuery(
    { companyId, includeDeleted: false },
    { skip: !companyId },
  );
  const isLoadingDuplicatePermissions = false;

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
    setIsCreateOpen(true);
  };

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

  const openPermissionsPage = (role: Role) => {
    navigate(`/permissions?roleId=${encodeURIComponent(role.id)}`);
  };

  const handleCreateRole = async () => {
    const name = roleNameInput.trim();
    if (!name) return toast.error('Role name is required');

    try {
      await createRole({ name }).unwrap();
      toast.success('Role created');
      setIsCreateOpen(false);
    } catch (error) {
      toast.error(getApplicationErrorMessage(error, '') || 'Failed to create role');
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
      toast.error(getApplicationErrorMessage(error, '') || 'Failed to update role');
    }
  };

  const handleDeleteRole = async (role: Role) => {
    try {
      await deleteRole(role.id).unwrap();
      toast.success('Role deleted');
      setRoleToDelete(null);
    } catch (error) {
      toast.error(getApplicationErrorMessage(error, '') || 'Failed to delete role');
    }
  };

  const columns = useMemo(
    () =>
      createRoleColumns({
        onRename: openRenameDialog,
        onManagePermissions: openPermissionsPage,
        onDelete: setRoleToDelete,
        canManage: canManageRoles,
      }),
    [canManageRoles, navigate],
  );

  return (
    <div className="w-full h-full min-h-0 overflow-y-auto p-4 space-y-4">
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

      <RolesDeleteDialog
        open={Boolean(roleToDelete)}
        roleName={roleToDelete?.name}
        onOpenChange={(open) => (!open ? setRoleToDelete(null) : null)}
        onConfirm={() => {
          if (!roleToDelete) return;
          void handleDeleteRole(roleToDelete);
        }}
      />
    </div>
  );
}
