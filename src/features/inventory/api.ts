import { api } from '@/services/api';
import { buildServerPaginationParams } from '@/services/rtk-query/pagination';
import { invalidateEntityListTag, provideEntityListTags } from '@/services/rtk-query/tags';
import type { ServerListQuery, ServerListResponse } from '@/services/rtk-query/types';
import { useAuthStore } from '@/stores/auth-store';
import type {
  StockAdjustment,
  StockAdjustmentCreateInput,
  StockAdjustmentListQuery,
  StockLevel,
  StockLevelListQuery,
  StockMovement,
  StockMovementCreateInput,
  StockMovementListQuery,
  StockTransfer,
  StockTransferCreateInput,
  StockTransferListQuery,
  StockTransferUpdateInput,
} from '@/features/inventory/stock/types/inventory-stock.types';
import {
  toCreateStockAdjustmentPayload,
  toCreateStockMovementPayload,
  toCreateStockTransferPayload,
  toUpdateStockTransferPayload,
} from '@/features/inventory/stock/utils/inventory-stock-payload';

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

export interface InventoryProductFilters {
  companyId?: string | null;
  categoryId?: string | null;
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
      StockLevelListQuery | void
    >({
      query: (query) => ({
        url: '/inventory/stock-levels',
        params: buildServerPaginationParams(query),
      }),
      providesTags: (result) => provideEntityListTags('Inventory', result),
    }),
    getStockLevel: builder.query<StockLevel, { productId: string; locationId: string }>({
      query: ({ productId, locationId }) => ({ url: `/inventory/stock-levels/${productId}/${locationId}` }),
      providesTags: (result) => (result ? [{ type: 'Inventory', id: result.id }] : ['Inventory']),
    }),
    listStockMovements: builder.query<ServerListResponse<StockMovement>, StockMovementListQuery | void>({
      query: (query) => ({
        url: '/inventory/stock-movements',
        params: buildServerPaginationParams(query),
      }),
      providesTags: (result) => provideEntityListTags('Inventory', result),
    }),
    createStockMovement: builder.mutation<{ id: string }, StockMovementCreateInput>({
      query: (body) => {
        const user = useAuthStore.getState().user;
        if (!user?.company?.id || !user?.id) throw new Error('Not authenticated');
        return {
          url: '/inventory/stock-movements',
          method: 'POST',
          body: toCreateStockMovementPayload(body, {
            companyId: user.company.id,
            createdBy: user.id,
          }),
        };
      },
      invalidatesTags: invalidateEntityListTag('Inventory'),
    }),
    listStockAdjustments: builder.query<ServerListResponse<StockAdjustment>, StockAdjustmentListQuery | void>({
      query: (query) => ({
        url: '/inventory/stock-adjustments',
        params: buildServerPaginationParams(query),
      }),
      providesTags: (result) => provideEntityListTags('Inventory', result),
    }),
    createStockAdjustment: builder.mutation<{ id: string }, StockAdjustmentCreateInput>({
      query: (body) => {
        const user = useAuthStore.getState().user;
        if (!user?.company?.id || !user?.id) throw new Error('Not authenticated');
        return {
          url: '/inventory/stock-adjustments',
          method: 'POST',
          body: toCreateStockAdjustmentPayload(body, {
            companyId: user.company.id,
            createdBy: user.id,
          }),
        };
      },
      invalidatesTags: invalidateEntityListTag('Inventory'),
    }),
    listStockTransfers: builder.query<ServerListResponse<StockTransfer>, StockTransferListQuery | void>({
      query: (query) => ({
        url: '/inventory/stock-transfers',
        params: buildServerPaginationParams(query),
      }),
      providesTags: (result) => provideEntityListTags('Inventory', result),
    }),
    getStockTransfer: builder.query<StockTransfer, string>({
      query: (id) => ({ url: `/inventory/stock-transfers/${id}` }),
      providesTags: (_result, _err, id) => [{ type: 'Inventory', id }],
    }),
    createStockTransfer: builder.mutation<{ id: string }, StockTransferCreateInput>({
      query: (body) => {
        const user = useAuthStore.getState().user;
        if (!user?.company?.id || !user?.id) throw new Error('Not authenticated');
        return {
          url: '/inventory/stock-transfers',
          method: 'POST',
          body: toCreateStockTransferPayload(body, {
            companyId: user.company.id,
            createdBy: user.id,
          }),
        };
      },
      invalidatesTags: invalidateEntityListTag('Inventory'),
    }),
    updateStockTransfer: builder.mutation<{ id: string }, { id: string; body: StockTransferUpdateInput }>({
      query: ({ id, body }) => {
        const user = useAuthStore.getState().user;
        return {
          url: `/inventory/stock-transfers/${id}`,
          method: 'PATCH',
          body: toUpdateStockTransferPayload(body, {
            completedBy: user?.id,
          }),
        };
      },
      invalidatesTags: (_result, _err, { id }) => [
        { type: 'Inventory', id },
        ...invalidateEntityListTag('Inventory'),
      ],
    }),
  }),
});

export const {
  useListProductsQuery,
  useGetProductQuery,
  useCreateProductMutation,
  useListStockLevelsQuery,
  useGetStockLevelQuery,
  useListStockMovementsQuery,
  useCreateStockMovementMutation,
  useListStockAdjustmentsQuery,
  useCreateStockAdjustmentMutation,
  useListStockTransfersQuery,
  useGetStockTransferQuery,
  useCreateStockTransferMutation,
  useUpdateStockTransferMutation,
} = inventoryApi;
