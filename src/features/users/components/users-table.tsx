import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { DataTable } from '@/components/datatable';
import type { PaginationMeta } from '@/server/types/pagination.types';
import { useAuthStore } from '@/stores/auth-store';
import { BranchType } from '@/db/schemas/enums';
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

export function UsersTable({ status = null, statuses = null }: UsersTableProps) {
  const authUser = useAuthStore((state) => state.user);
  const companyId = authUser?.company?.id ?? null;
  const branchType = authUser?.branch?.type ?? null;
  const serverFilters = useMemo(
    () => ({
      companyId,
      branchId:
        branchType === BranchType.HEADOFFICE ? undefined : (authUser?.branch?.id ?? undefined),
      locationId: authUser?.locationId ?? undefined,
      status: status ?? undefined,
      statuses: statuses ?? undefined,
    }),
    [authUser?.branch?.id, authUser?.locationId, branchType, companyId, status, statuses],
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
  );
}
