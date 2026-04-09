import { api } from '@/services/api';
import {
  buildServerPaginationParams,
  invalidateEntityListTag,
  provideEntityListTags,
  type ServerListResponse,
} from '@/services/rtk-query';
import { useAuthStore } from '@/stores/auth-store';
import type {
  InventoryLocation,
  InventoryLocationCreatePayload,
  InventoryLocationListQuery,
  InventoryLocationMutationInput,
  InventoryLocationUpdatePayload,
} from '../types/inventory-location.types';
import {
  toCreateInventoryLocationPayload,
  toUpdateInventoryLocationPayload,
} from '../utils/inventory-location-payload';

export interface InventoryLocationOption {
  id: string;
  name: string;
  branchId: string;
  locationType: number;
  parentLocationId: string | null;
}

export const inventoryLocationsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listInventoryLocations: builder.query<
      ServerListResponse<InventoryLocation>,
      InventoryLocationListQuery | void
    >({
      query: (query) => ({
        url: '/inventory/locations',
        params: buildServerPaginationParams(query),
      }),
      providesTags: (result) => provideEntityListTags('Inventory', result),
    }),

    getInventoryLocation: builder.query<InventoryLocation, string>({
      query: (id) => ({ url: `/inventory/locations/${id}` }),
      providesTags: (_result, _err, id) => [{ type: 'Inventory', id }],
    }),

    listInventoryLocationOptions: builder.query<
      InventoryLocationOption[],
      {
        companyId?: string | null;
        branchId?: string | null;
        locationType?: number | null;
        parentLocationId?: string | null;
        search?: string;
      } | void
    >({
      query: (params) => ({
        url: '/inventory/locations/options',
        params: params ?? undefined,
      }),
      providesTags: [{ type: 'Inventory', id: 'LOCATION_OPTIONS' }],
    }),

    updateInventoryLocation: builder.mutation<
      { id: string },
      { id: string; body: InventoryLocationMutationInput }
    >({
      query: ({ id, body }) => ({
        url: `/inventory/locations/${id}`,
        method: 'PATCH',
        body: toUpdateInventoryLocationPayload(body) satisfies InventoryLocationUpdatePayload,
      }),
      invalidatesTags: (_result, _err, { id }) => [
        { type: 'Inventory', id },
        ...invalidateEntityListTag('Inventory'),
      ],
    }),

    createInventoryLocation: builder.mutation<{ id: string }, InventoryLocationMutationInput>({
      query: (body) => {
        const user = useAuthStore.getState().user;
        if (!user?.company?.id || !user?.id) throw new Error('Not authenticated');
        return {
          url: '/inventory/locations',
          method: 'POST',
          body: toCreateInventoryLocationPayload(body, {
            companyId: user.company.id,
            createdBy: user.id,
          }) satisfies InventoryLocationCreatePayload,
        };
      },
      invalidatesTags: invalidateEntityListTag('Inventory'),
    }),

    deleteInventoryLocation: builder.mutation<void, string>({
      query: (id) => ({
        url: `/inventory/locations/${id}`,
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
  useListInventoryLocationsQuery,
  useGetInventoryLocationQuery,
  useListInventoryLocationOptionsQuery,
  useUpdateInventoryLocationMutation,
  useCreateInventoryLocationMutation,
  useDeleteInventoryLocationMutation,
} = inventoryLocationsApi;
