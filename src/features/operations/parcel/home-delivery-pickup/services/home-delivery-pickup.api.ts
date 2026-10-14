import { api } from '@/services/api';

export const homeDeliveryPickupApi = api.injectEndpoints({
  endpoints: (builder) => ({
    returnHomeDeliveryToPickup: builder.mutation<{ id: string }, string>({
      query: (parcelId) => ({
        url: `/deliveries/dd/${parcelId}/return-to-pickup`,
        method: 'POST',
      }),
      invalidatesTags: (_result, error, parcelId) =>
        error
          ? []
          : [
              { type: 'Bookings', id: 'LIST' },
              { type: 'Bookings', id: parcelId },
            ],
    }),
  }),
});
export const { useReturnHomeDeliveryToPickupMutation } = homeDeliveryPickupApi;
