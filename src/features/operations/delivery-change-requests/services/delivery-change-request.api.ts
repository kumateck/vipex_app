import { api } from '@/services/api';
import type { DeliveryChangeRequest } from '../types/delivery-change-request.types';

export const deliveryChangeRequestApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getMyPendingDeliveryChanges: builder.query<DeliveryChangeRequest[], void>({
      query: () => '/deliveries/dd/change-requests/mine',
      providesTags: [{ type: 'Bookings', id: 'DELIVERY_CHANGE_REQUESTS' }],
    }),
    getPendingDeliveryChanges: builder.query<DeliveryChangeRequest[], void>({
      query: () => '/deliveries/dd/change-requests/pending',
      providesTags: [{ type: 'Bookings', id: 'DELIVERY_CHANGE_REQUESTS' }],
    }),
    requestDeliveryChange: builder.mutation<
      { id: string },
      {
        parcelId: string;
        requestedDropoffAddress: string;
        requestedDeliveryFeeCedis: string;
        reason: string;
      }
    >({
      query: ({ parcelId, ...body }) => ({
        url: `/deliveries/dd/${parcelId}/change-request`,
        method: 'POST',
        body,
      }),
      invalidatesTags: [
        { type: 'Bookings', id: 'LIST' },
        { type: 'Bookings', id: 'DELIVERY_CHANGE_REQUESTS' },
      ],
    }),
    decideDeliveryChange: builder.mutation<
      { id: string },
      {
        deliveryId: string;
        decision: 'APPROVED' | 'REJECTED';
        reviewNote?: string | null;
      }
    >({
      query: ({ deliveryId, ...body }) => ({
        url: `/deliveries/dd/change-requests/${deliveryId}/decision`,
        method: 'POST',
        body,
      }),
      invalidatesTags: [
        { type: 'Bookings', id: 'LIST' },
        { type: 'Bookings', id: 'DELIVERY_CHANGE_REQUESTS' },
      ],
    }),
  }),
});

export const {
  useGetMyPendingDeliveryChangesQuery,
  useGetPendingDeliveryChangesQuery,
  useRequestDeliveryChangeMutation,
  useDecideDeliveryChangeMutation,
} = deliveryChangeRequestApi;
