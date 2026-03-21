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
};

type InventoryProductOptionsParams = {
  companyId?: string | null;
  categoryId?: string | null;
  search?: string;
};

export interface InventoryProductOption {
  id: string;
  name: string;
  sku: string;
}

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
        url: '/inventory/categories/options',
        params: {
          companyId: params?.companyId ?? null,
          search: params?.search,
        },
      }),
      providesTags: [{ type: 'Inventory', id: 'CATEGORY_OPTIONS' }],
    }),
    listInventoryProductOptions: builder.query<InventoryProductOption[], InventoryProductOptionsParams | void>({
      query: (params) => ({
        url: '/inventory/products/options',
        params: {
          companyId: params?.companyId ?? null,
          categoryId: params?.categoryId ?? null,
          search: params?.search,
        },
      }),
      providesTags: [{ type: 'Inventory', id: 'PRODUCT_OPTIONS' }],
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
  useListInventoryProductOptionsQuery,
  useCreateInventoryProductMutation,
  useUpdateInventoryProductMutation,
  useDeleteInventoryProductMutation,
} = inventoryProductsApi;
