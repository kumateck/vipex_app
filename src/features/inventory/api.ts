import { api } from '@/services/api';
import {
  buildServerPaginationParams,
  provideEntityListTags,
  type ServerListQuery,
  type ServerListResponse,
} from '@/services/rtk-query';

export interface InventoryCategory {
  id: string;
  companyId: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryProduct {
  id: string;
  companyId: string;
  categoryId?: string;
  sku: string;
  name: string;
  description?: string;
  unitOfMeasure: number;
  minStockLevel: string; // from server as string or number; prefer string for bigint
  createdAt: string;
  updatedAt: string;
}

export interface StockLevel {
  id: string;
  companyId: string;
  productId: string;
  locationId: string;
  quantity: string; // bigint serialized
  updatedAt: string;
}

export interface InventoryProductFilters {
  companyId?: string | null;
  categoryId?: string | null;
}

export interface StockLevelFilters {
  companyId?: string | null;
  productId?: string | null;
  locationId?: string | null;
}

export const inventoryApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listProducts: builder.query<
      ServerListResponse<InventoryProduct>,
      ServerListQuery<InventoryProductFilters> | void
    >({
      query: (query) => ({
        url: '/inventory/products',
        params: buildServerPaginationParams(query),
      }),
      providesTags: (result) => provideEntityListTags('Inventory', result),
    }),
    getProduct: builder.query<InventoryProduct, string>({
      query: (id) => ({ url: `/inventory/products/${id}` }),
      providesTags: (result) => (result ? [{ type: 'Inventory', id: result.id }] : ['Inventory']),
    }),
    createProduct: builder.mutation<
      { id: string },
      Omit<InventoryProduct, 'id' | 'createdAt' | 'updatedAt'>
    >({
      query: (body) => ({ url: '/inventory/products', method: 'POST', body }),
      invalidatesTags: ['Inventory'],
    }),
    listStockLevels: builder.query<
      ServerListResponse<StockLevel>,
      ServerListQuery<StockLevelFilters> | void
    >({
      query: (query) => ({
        url: '/inventory/stock-levels',
        params: buildServerPaginationParams(query),
      }),
      providesTags: (result) => provideEntityListTags('Inventory', result),
    }),
  }),
});

export const {
  useListProductsQuery,
  useGetProductQuery,
  useCreateProductMutation,
  useListStockLevelsQuery,
} = inventoryApi;
