import { api } from '@/services/api';
import {
  buildServerPaginationParams,
  invalidateEntityListTag,
  provideEntityListTags,
  type ServerListQuery,
  type ServerListResponse,
} from '@/services/rtk-query';
import { useAuthStore } from '@/stores/auth-store';

export interface Warehouse {
  id: string;
  companyId: string;
  branchId: string;
  branch?: { id: string; name: string } | null;
  name: string;
  description?: string | null;
  active: boolean;
  isDeleted: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface WarehouseOption {
  id: string;
  name: string;
  branchId: string;
}

export type WarehouseFilters = {
  companyId?: string | null;
  branchId?: string | null;
  includeDeleted?: boolean | null;
};

export type WarehouseListQuery = ServerListQuery<WarehouseFilters>;

export interface WarehouseMutationInput {
  branchId: string;
  name: string;
  description?: string | null;
  active?: boolean;
}

export const warehousesApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listWarehouses: builder.query<ServerListResponse<Warehouse>, WarehouseListQuery | void>({
      query: (query) => ({
        url: '/warehouses/',
        params: buildServerPaginationParams(query),
      }),
      providesTags: (result) => provideEntityListTags('Warehouses', result),
    }),
    getWarehouse: builder.query<Warehouse, string>({
      query: (id) => ({ url: `/warehouses/${id}` }),
      providesTags: (_result, _err, id) => [{ type: 'Warehouses', id }],
    }),
    listWarehouseOptions: builder.query<
      WarehouseOption[],
      {
        companyId?: string | null;
        branchId?: string | null;
        search?: string;
        includeDeleted?: boolean;
        activeOnly?: boolean;
      } | void
    >({
      query: (params) => ({
        url: '/warehouses/options',
        params: params ?? undefined,
      }),
      providesTags: [{ type: 'Warehouses', id: 'OPTIONS' }],
    }),
    createWarehouse: builder.mutation<{ id: string }, WarehouseMutationInput>({
      query: (body) => {
        const user = useAuthStore.getState().user;
        if (!user?.company?.id || !user.id) throw new Error('Not authenticated');
        return {
          url: '/warehouses/',
          method: 'POST',
          body: {
            companyId: user.company.id,
            branchId: body.branchId,
            name: body.name.trim(),
            description: body.description?.trim() || null,
            active: body.active ?? true,
            createdBy: user.id,
          },
        };
      },
      invalidatesTags: invalidateEntityListTag('Warehouses'),
    }),
    updateWarehouse: builder.mutation<{ id: string }, { id: string; body: WarehouseMutationInput }>(
      {
        query: ({ id, body }) => ({
          url: `/warehouses/${id}`,
          method: 'PATCH',
          body: {
            name: body.name.trim(),
            description: body.description?.trim() || null,
            active: body.active ?? true,
          },
        }),
        invalidatesTags: (_result, _err, { id }) => [
          { type: 'Warehouses', id },
          ...invalidateEntityListTag('Warehouses'),
        ],
      },
    ),
    deleteWarehouse: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: `/warehouses/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _err, id) => [
        { type: 'Warehouses', id },
        ...invalidateEntityListTag('Warehouses'),
      ],
    }),
  }),
});

export const {
  useListWarehousesQuery,
  useGetWarehouseQuery,
  useListWarehouseOptionsQuery,
  useCreateWarehouseMutation,
  useUpdateWarehouseMutation,
  useDeleteWarehouseMutation,
} = warehousesApi;
