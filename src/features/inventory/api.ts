import { api } from '@/services/api';

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

export const inventoryApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listProducts: builder.query<
      { data: InventoryProduct[] },
      { companyId?: string; search?: string }
    >({
      query: (params) => ({ url: '/inventory/products', params }),
      providesTags: (result) =>
        result?.data
          ? [...result.data.map((p) => ({ type: 'Inventory' as const, id: p.id })), 'Inventory']
          : ['Inventory'],
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
      { data: StockLevel[] },
      { companyId?: string; productId?: string; locationId?: string }
    >({
      query: (params) => ({ url: '/inventory/stock-levels', params }),
      providesTags: ['Inventory'],
    }),
  }),
});

export const {
  useListProductsQuery,
  useGetProductQuery,
  useCreateProductMutation,
  useListStockLevelsQuery,
} = inventoryApi;
