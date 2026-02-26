import { api } from '@/services/api';
import {
  buildServerPaginationParams,
  invalidateEntityListTag,
  provideEntityListTags,
  type ServerListResponse,
} from '@/services/rtk-query';
import { useAuthStore } from '@/stores/auth-store';
import type {
  InventoryCategory,
  InventoryCategoryCreatePayload,
  InventoryCategoryListQuery,
  InventoryCategoryMutationInput,
  InventoryCategoryUpdatePayload,
} from '../types/inventory-category.types';
import {
  toCreateInventoryCategoryPayload,
  toUpdateInventoryCategoryPayload,
} from '../utils/inventory-category-payload';

export const inventoryCategoriesApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listInventoryCategories: builder.query<
      ServerListResponse<InventoryCategory>,
      InventoryCategoryListQuery | void
    >({
      query: (query) => ({
        url: '/inventory/categories',
        params: buildServerPaginationParams(query),
      }),
      providesTags: (result) => provideEntityListTags('Inventory', result),
    }),

    getInventoryCategory: builder.query<InventoryCategory, string>({
      query: (id) => ({ url: `/inventory/categories/${id}` }),
      providesTags: (_result, _err, id) => [{ type: 'Inventory', id }],
    }),

    updateInventoryCategory: builder.mutation<
      { id: string },
      { id: string; body: InventoryCategoryMutationInput }
    >({
      query: ({ id, body }) => ({
        url: `/inventory/categories/${id}`,
        method: 'PATCH',
        body: toUpdateInventoryCategoryPayload(body) satisfies InventoryCategoryUpdatePayload,
      }),
      invalidatesTags: (_result, _err, { id }) => [
        { type: 'Inventory', id },
        ...invalidateEntityListTag('Inventory'),
      ],
    }),

    createInventoryCategory: builder.mutation<{ id: string }, InventoryCategoryMutationInput>({
      query: (body) => {
        const user = useAuthStore.getState().user;
        if (!user?.company?.id || !user?.id) throw new Error('Not authenticated');

        return {
          url: '/inventory/categories',
          method: 'POST',
          body: toCreateInventoryCategoryPayload(body, {
            companyId: user.company.id,
            createdBy: user.id,
          }) satisfies InventoryCategoryCreatePayload,
        };
      },
      invalidatesTags: invalidateEntityListTag('Inventory'),
    }),

    deleteInventoryCategory: builder.mutation<void, string>({
      query: (id) => ({
        url: `/inventory/categories/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _err, id) => [
        { type: 'Inventory', id },
        ...invalidateEntityListTag('Inventory'),
      ],
    }),
  }),
});

export const {
  useListInventoryCategoriesQuery,
  useGetInventoryCategoryQuery,
  useUpdateInventoryCategoryMutation,
  useCreateInventoryCategoryMutation,
  useDeleteInventoryCategoryMutation,
} = inventoryCategoriesApi;
