import { api } from '@/services/api';
import type { ParcelDestinationOptions } from '@/shared/shipments/parcel-destination-change';
import type { ChangeParcelDestinationInput } from '../types';

const parcelDestinationApi = api.injectEndpoints({
  endpoints: (builder) => ({
    parcelDestinationOptions: builder.query<ParcelDestinationOptions, string>({
      query: (parcelId) => `/shipments/parcels/${parcelId}/destination-options`,
      providesTags: (_result, _error, parcelId) => [{ type: 'Bookings', id: parcelId }],
    }),
    changeParcelDestination: builder.mutation<
      { id: string; changed: boolean },
      ChangeParcelDestinationInput
    >({
      query: ({ parcelId, ...body }) => ({
        url: `/shipments/parcels/${parcelId}/destination`,
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

export const { useParcelDestinationOptionsQuery, useChangeParcelDestinationMutation } =
  parcelDestinationApi;
