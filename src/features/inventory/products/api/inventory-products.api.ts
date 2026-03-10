import { api } from '@/services/api';
import {
  buildServerPaginationParams,
  invalidateEntityListTag,
  provideEntityListTags,
  type ServerListResponse,
} from '@/services/rtk-query';
import { useAuthStore } from '@/stores/auth-store';
import type {
  InventoryProduct,
  InventoryProductCategoryOption,
  InventoryProductCreatePayload,
  InventoryProductListQuery,
  InventoryProductMutationInput,
  InventoryProductUpdatePayload,
} from '../types/inventory-product.types';
import { toCreateInventoryProductPayload, toUpdateInventoryProductPayload } from '../utils/inventory-product-payload';

type InventoryProductCategoryOptionsParams = {
  companyId?: string | null;
  search?: string;
  pageSize?: number;
};

export const inventoryProductsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listInventoryProducts: builder.query<ServerListResponse<InventoryProduct>, InventoryProductListQuery | void>({
      query: (query) => ({
        url: '/inventory/products',
        params: buildServerPaginationParams(query),
      }),
      providesTags: (result) => provideEntityListTags('Inventory', result),
    }),
    getInventoryProduct: builder.query<InventoryProduct, string>({
      query: (id) => ({ url: `/inventory/products/${id}` }),
      providesTags: (_result, _err, id) => [{ type: 'Inventory', id }],
    }),
    listInventoryProductCategoryOptions: builder.query<
      InventoryProductCategoryOption[],
      InventoryProductCategoryOptionsParams | void
    >({
      query: (params) => ({
        url: '/inventory/categories',
        params: buildServerPaginationParams({
          page: 1,
          pageSize: Math.min(params?.pageSize ?? 100, 100),
          search: params?.search,
          filters: { companyId: params?.companyId ?? null },
        }),
      }),
      transformResponse: (response: ServerListResponse<InventoryProductCategoryOption>) => response.data ?? [],
      providesTags: [{ type: 'Inventory', id: 'CATEGORY_OPTIONS' }],
    }),
    createInventoryProduct: builder.mutation<{ id: string }, InventoryProductMutationInput>({
      query: (body) => {
        const user = useAuthStore.getState().user;
        if (!user?.company?.id || !user?.id) throw new Error('Not authenticated');

        return {
          url: '/inventory/products',
          method: 'POST',
          body: toCreateInventoryProductPayload(body, {
            companyId: user.company.id,
            createdBy: user.id,
          }) satisfies InventoryProductCreatePayload,
        };
      },
      invalidatesTags: invalidateEntityListTag('Inventory'),
    }),
    updateInventoryProduct: builder.mutation<{ id: string }, { id: string; body: InventoryProductMutationInput }>({
      query: ({ id, body }) => ({
        url: `/inventory/products/${id}`,
        method: 'PATCH',
        body: toUpdateInventoryProductPayload(body) satisfies InventoryProductUpdatePayload,
      }),
      invalidatesTags: (_result, _err, { id }) => [
        { type: 'Inventory', id },
        ...invalidateEntityListTag('Inventory'),
      ],
    }),
    deleteInventoryProduct: builder.mutation<void, string>({
      query: (id) => ({
        url: `/inventory/products/${id}`,
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
  useListInventoryProductsQuery,
  useGetInventoryProductQuery,
  useListInventoryProductCategoryOptionsQuery,
  useCreateInventoryProductMutation,
  useUpdateInventoryProductMutation,
  useDeleteInventoryProductMutation,
} = inventoryProductsApi;
