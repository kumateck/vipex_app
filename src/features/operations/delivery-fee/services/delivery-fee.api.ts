import { api } from '@/services/api';
import type { DeliveryFeeContext } from '../types';

export const deliveryFeeApi = api.injectEndpoints({
  endpoints: (builder) => ({
    readDeliveryFee: builder.query<DeliveryFeeContext, string>({
      query: (parcelId) => `/deliveries/dd/${parcelId}/fee`,
      providesTags: (_result, _error, parcelId) => [{ type: 'Bookings', id: parcelId }],
    }),
    editDeliveryFee: builder.mutation<
      { id: string; chargePsw: number; changed: boolean },
      {
        parcelId: string;
        deliveryFeeCedis: string;
        expectedChargePsw: number;
        expectedUpdatedAt: string;
        reason: string;
      }
    >({
      query: ({ parcelId, ...body }) => ({
        url: `/deliveries/dd/${parcelId}/fee`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_result, error, { parcelId }) =>
        error
          ? []
          : [
              { type: 'Bookings', id: 'LIST' },
              { type: 'Bookings', id: parcelId },
            ],
    }),
  }),
});
export const { useLazyReadDeliveryFeeQuery, useEditDeliveryFeeMutation } = deliveryFeeApi;
