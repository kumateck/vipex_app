import { api } from '@/services/api';
import { useAuthStore } from '@/stores/auth-store';

export interface Location {
  id: string;
  name: string;
  branchId: string;
  companyId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ListLocationsResponse {
  data: Location[];
  nextCursor?: string | null;
}

export interface ListLocationsParams {
  limit?: number;
  after?: string | null;
  companyId?: string | null;
}

export interface UpdateLocationBody {
  name?: string;
}

export interface CreateLocationBody {
  name: string;
  branchId: string;
}

export const locationsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listLocations: builder.query<ListLocationsResponse, ListLocationsParams | void>({
      query: (params) => ({
        url: '/locations/',
        params: params ?? { limit: 50 },
      }),
      providesTags: (result) =>
        result
          ? [{ type: 'Locations', id: 'LIST' }, ...result.data.map((l) => ({ type: 'Locations' as const, id: l.id }))]
          : [{ type: 'Locations', id: 'LIST' }],
    }),

    getLocation: builder.query<Location, string>({
      query: (id) => ({ url: `/locations/${id}` }),
      providesTags: (_result, _err, id) => [{ type: 'Locations', id }],
    }),

    updateLocation: builder.mutation<{ id: string }, { id: string; body: UpdateLocationBody }>({
      query: ({ id, body }) => ({
        url: `/locations/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_result, _err, { id }) => [{ type: 'Locations', id }, { type: 'Locations', id: 'LIST' }],
    }),

    createLocation: builder.mutation<{ id: string }, CreateLocationBody>({
      query: (body) => {
        const user = useAuthStore.getState().user;
        if (!user?.company?.id || !user?.id) throw new Error('Not authenticated');
        return {
          url: '/locations/',
          method: 'POST',
          body: {
            companyId: user.company.id,
            branchId: body.branchId,
            name: body.name,
            createdBy: user.id,
          },
        };
      },
      invalidatesTags: [{ type: 'Locations', id: 'LIST' }],
    }),

    deleteLocation: builder.mutation<void, string>({
      query: (id) => ({
        url: `/locations/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _err, id) => [{ type: 'Locations', id }, { type: 'Locations', id: 'LIST' }],
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
