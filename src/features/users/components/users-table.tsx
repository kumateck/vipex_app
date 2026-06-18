import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { DataTable } from '@/components/datatable';
import { FieldLabel } from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-searchable';
import type { PaginationMeta } from '@/server/types/pagination.types';
import { USER_TYPES, USER_TYPE_LABELS, type UserType } from '@/shared/access/constants';
import { useAuthStore } from '@/stores/auth-store';
import { BranchType } from '@/db/schemas/enums';
import { useListRoleOptionsQuery } from '@/features/rbac';
import {
  useListUsersQuery,
  useResendSetupInviteMutation,
  useUpdateUserStatusMutation,
} from '../api/users.api';
import { createUserColumns } from './user-columns';
import type { UserListQuery } from '../types/user.types';
import { getUserErrorMessage } from '../utils/user-error';

const EMPTY_META: PaginationMeta = {
  totalRecords: 0,
  totalPages: 1,
  page: 1,
  pageSize: 20,
  hasNextPage: false,
  hasPreviousPage: false,
};

interface UsersTableProps {
  status?: number | null;
  statuses?: string | null;
}

const ALL_ROLES = '__all_roles__';
const ALL_USER_TYPES = '__all_user_types__';

export function UsersTable({ status = null, statuses = null }: UsersTableProps) {
  const authUser = useAuthStore((state) => state.user);
  const companyId = authUser?.company?.id ?? null;
  const branchType = authUser?.branch?.type ?? null;
  const [selectedRoleId, setSelectedRoleId] = useState<string>(ALL_ROLES);
  const [selectedUserType, setSelectedUserType] = useState<string>(ALL_USER_TYPES);
  const { data: roleOptions = [] } = useListRoleOptionsQuery({ companyId }, { skip: !companyId });
  const serverFilters = useMemo(
    () => ({
      companyId,
      branchId:
        branchType === BranchType.HEADOFFICE ? undefined : (authUser?.branch?.id ?? undefined),
      locationId: authUser?.locationId ?? undefined,
      roleId: selectedRoleId === ALL_ROLES ? undefined : selectedRoleId,
      userType:
        selectedUserType === ALL_USER_TYPES ? undefined : (Number(selectedUserType) as UserType),
      status: status ?? undefined,
      statuses: statuses ?? undefined,
    }),
    [
      authUser?.branch?.id,
      authUser?.locationId,
      branchType,
      companyId,
      selectedRoleId,
      selectedUserType,
      status,
      statuses,
    ],
  );
  const [query, setQuery] = useState<UserListQuery>({
    page: 1,
    pageSize: 20,
    filters: serverFilters,
  });

  useEffect(() => {
    setQuery((prev) => ({
      ...prev,
      page: 1,
      filters: serverFilters,
    }));
  }, [serverFilters]);

  const handleRequestChange = useCallback((request: UserListQuery) => {
    setQuery(request);
  }, []);

  const [resendSetupInvite, { isLoading: isResendingInvite }] = useResendSetupInviteMutation();
  const [updateUserStatus, { isLoading: isUpdatingStatus }] = useUpdateUserStatusMutation();

  const handleResendInvite = useCallback(
    async (userId: string) => {
      try {
        await resendSetupInvite({ id: userId, force: true }).unwrap();
        toast.success('Invitation email resent successfully');
      } catch (error) {
        toast.error(getUserErrorMessage(error));
      }
    },
    [resendSetupInvite],
  );

  const handleToggleUserStatus = useCallback(
    async (userId: string, currentStatus: number) => {
      const nextStatus = currentStatus === 0 ? 4 : 0;
      const actionLabel = nextStatus === 0 ? 'activated' : 'set to inactive';
      try {
        await updateUserStatus({ id: userId, status: nextStatus }).unwrap();
        toast.success(`User ${actionLabel} successfully`);
      } catch (error) {
        toast.error(getUserErrorMessage(error));
      }
    },
    [updateUserStatus],
  );

  const { data, isLoading } = useListUsersQuery(query, { skip: !companyId });
  const columns = useMemo(
    () =>
      createUserColumns({
        isResendingInvite,
        isUpdatingStatus,
        onResendInvite: (user) => {
          void handleResendInvite(user.id);
        },
        onToggleStatus: (user) => {
          void handleToggleUserStatus(user.id, user.status);
        },
      }),
    [handleResendInvite, handleToggleUserStatus, isResendingInvite, isUpdatingStatus],
  );

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="space-y-1">
          <FieldLabel htmlFor="users-role-filter">Role</FieldLabel>
          <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
            <SelectTrigger id="users-role-filter">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_ROLES}>All roles</SelectItem>
              {roleOptions.map((role) => (
                <SelectItem key={role.id} value={role.id}>
                  {role.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <FieldLabel htmlFor="users-user-type-filter">User Type</FieldLabel>
          <Select value={selectedUserType} onValueChange={setSelectedUserType}>
            <SelectTrigger id="users-user-type-filter">
              <SelectValue placeholder="Filter by user type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_USER_TYPES}>All user types</SelectItem>
              {USER_TYPES.map((type) => (
                <SelectItem key={type} value={String(type)}>
                  {USER_TYPE_LABELS[type]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <DataTable
        mode="server"
        data={data?.data ?? []}
        columns={columns}
        meta={data?.meta ?? EMPTY_META}
        loading={isLoading}
        serverFilters={serverFilters}
        onRequestChange={handleRequestChange}
        searchPlaceholder="Search users..."
        enableVirtualization={false}
      />
    </div>
  );
}
