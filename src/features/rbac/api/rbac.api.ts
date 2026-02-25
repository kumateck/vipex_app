import { api } from '@/services/api';
import {
  buildServerPaginationParams,
  invalidateEntityListTag,
  provideEntityListTags,
  type ServerListQuery,
  type ServerListResponse,
} from '@/services/rtk-query';

export interface Role {
  id: string;
  companyId: string;
  name: string;
  isDeleted: boolean;
  createdBy: string;
  createdAt?: string | null;
  updatedAt?: string | null;
  permissions: string[];
}

export interface RoleOption {
  id: string;
  name: string;
}

export interface PermissionCatalogItem {
  key: string;
  description: string;
  group: string;
}

export interface RoleFilters {
  companyId?: string | null;
  includeDeleted?: boolean | null;
}

export const rbacApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listRoles: builder.query<ServerListResponse<Role>, ServerListQuery<RoleFilters> | void>({
      query: (query) => ({
        url: '/rbac/roles',
        params: buildServerPaginationParams(query),
      }),
      providesTags: (result) => provideEntityListTags('RBAC', result),
    }),

    listRoleOptions: builder.query<
      RoleOption[],
      { companyId?: string | null; search?: string; includeDeleted?: boolean } | void
    >({
      query: (params) => ({
        url: '/rbac/roles/options',
        params: params ?? undefined,
      }),
      providesTags: [{ type: 'RBAC', id: 'ROLE_OPTIONS' }],
    }),

    listPermissionCatalog: builder.query<{ data: PermissionCatalogItem[] }, void>({
      query: () => ({ url: '/rbac/permissions' }),
      providesTags: [{ type: 'RBAC', id: 'PERMISSIONS' }],
    }),

    createRole: builder.mutation<{ id: string }, { name: string; permissionKeys?: string[] }>({
      query: (body) => ({
        url: '/rbac/roles',
        method: 'POST',
        body,
      }),
      invalidatesTags: invalidateEntityListTag('RBAC'),
    }),

    updateRole: builder.mutation<{ id: string }, { id: string; name: string }>({
      query: ({ id, name }) => ({
        url: `/rbac/roles/${id}`,
        method: 'PATCH',
        body: { name },
      }),
      invalidatesTags: (_result, _err, { id }) => [{ type: 'RBAC', id }, ...invalidateEntityListTag('RBAC')],
    }),

    deleteRole: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: `/rbac/roles/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _err, id) => [{ type: 'RBAC', id }, ...invalidateEntityListTag('RBAC')],
    }),

    getRolePermissions: builder.query<{ permissionKeys: string[] }, string>({
      query: (roleId) => ({
        url: `/rbac/roles/${roleId}/permissions`,
      }),
      providesTags: (_result, _err, id) => [{ type: 'RBAC', id }],
    }),

    setRolePermissions: builder.mutation<{ success: boolean }, { roleId: string; permissionKeys: string[] }>({
      query: ({ roleId, permissionKeys }) => ({
        url: `/rbac/roles/${roleId}/permissions`,
        method: 'PUT',
        body: { permissionKeys },
      }),
      invalidatesTags: () => [...invalidateEntityListTag('RBAC'), { type: 'RBAC', id: 'PERMISSIONS' }],
    }),
  }),
});

export const {
  useListRolesQuery,
  useListRoleOptionsQuery,
  useListPermissionCatalogQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useDeleteRoleMutation,
  useGetRolePermissionsQuery,
  useSetRolePermissionsMutation,
} = rbacApi;
