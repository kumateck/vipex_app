import { api } from '@/services/api';
import type { ServerListResponse } from '@/services/rtk-query';
import type { ParcelSearchRow } from '../../api/parcel.api';

export const returnedRiderParcelsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listReturnedRiderParcels: builder.query<
      ServerListResponse<ParcelSearchRow>,
      { page: number; pageSize: number; search?: string }
    >({
      query: (params) => ({ url: '/deliveries/dd/returned', params }),
      providesTags: [{ type: 'Bookings', id: 'LIST' }],
    }),
    listReturnRedispatchRiders: builder.query<Array<{ id: string; fullname: string }>, void>({
      query: () => '/deliveries/dd/returned/riders',
      providesTags: ['Users'],
    }),
    reprocessRiderReturnForPickup: builder.mutation<{ id: string }, string>({
      query: (parcelId) => ({
        url: `/deliveries/dd/${parcelId}/returned-to-pickup`,
        method: 'POST',
      }),
      invalidatesTags: [{ type: 'Bookings', id: 'LIST' }],
    }),
    redispatchRiderReturn: builder.mutation<
      { id: string },
      { parcelId: string; riderUserId: string }
    >({
      query: ({ parcelId, riderUserId }) => ({
        url: `/deliveries/dd/${parcelId}/redispatch-return`,
        method: 'POST',
        body: { riderUserId },
      }),
      invalidatesTags: [{ type: 'Bookings', id: 'LIST' }],
    }),
    redispatchRiderReturnsBulk: builder.mutation<
      { succeeded: string[]; failed: Array<{ parcelId: string; message: string }> },
      { parcelIds: string[]; riderUserId: string }
    >({
      query: (body) => ({
        url: '/deliveries/dd/returned/redispatch-bulk',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Bookings', id: 'LIST' }],
    }),
  }),
});

export const {
  useListReturnedRiderParcelsQuery,
  useListReturnRedispatchRidersQuery,
  useReprocessRiderReturnForPickupMutation,
  useRedispatchRiderReturnMutation,
  useRedispatchRiderReturnsBulkMutation,
} = returnedRiderParcelsApi;
