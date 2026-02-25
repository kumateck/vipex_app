import { api } from '@/services/api';
import {
  buildServerPaginationParams,
  invalidateEntityListTag,
  provideEntityListTags,
  type ServerListResponse,
} from '@/services/rtk-query';
import { useAuthStore } from '@/stores/auth-store';
import type {
  Location,
  LocationCreatePayload,
  LocationListQuery,
  LocationMutationInput,
  LocationUpdatePayload,
} from '../types/location.types';
import { toCreateLocationPayload, toUpdateLocationPayload } from '../utils/location-payload';

export const locationsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listLocations: builder.query<ServerListResponse<Location>, LocationListQuery | void>({
      query: (query) => ({
        url: '/locations/',
        params: buildServerPaginationParams(query),
      }),
      providesTags: (result) => provideEntityListTags('Locations', result),
    }),

    getLocation: builder.query<Location, string>({
      query: (id) => ({ url: `/locations/${id}` }),
      providesTags: (_result, _err, id) => [{ type: 'Locations', id }],
    }),

    updateLocation: builder.mutation<{ id: string }, { id: string; body: LocationMutationInput }>({
      query: ({ id, body }) => ({
        url: `/locations/${id}`,
        method: 'PATCH',
        body: toUpdateLocationPayload(body) satisfies LocationUpdatePayload,
      }),
      invalidatesTags: (_result, _err, { id }) => [
        { type: 'Locations', id },
        ...invalidateEntityListTag('Locations'),
      ],
    }),

    createLocation: builder.mutation<{ id: string }, LocationMutationInput>({
      query: (body) => {
        const user = useAuthStore.getState().user;
        if (!user?.company?.id || !user?.id) throw new Error('Not authenticated');
        return {
          url: '/locations/',
          method: 'POST',
          body: toCreateLocationPayload(body, {
            companyId: user.company.id,
            createdBy: user.id,
          }) satisfies LocationCreatePayload,
        };
      },
      invalidatesTags: invalidateEntityListTag('Locations'),
    }),

    deleteLocation: builder.mutation<void, string>({
      query: (id) => ({
        url: `/locations/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _err, id) => [
        { type: 'Locations', id },
        ...invalidateEntityListTag('Locations'),
      ],
    }),
  }),
});

export const {
  useListLocationsQuery,
  useGetLocationQuery,
  useUpdateLocationMutation,
  useCreateLocationMutation,
  useDeleteLocationMutation,
} = locationsApi;
