import { api } from '@/services/api';
import type { ParcelHistoryEvent } from '../types';

export const parcelHistoryApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getParcelHistory: builder.query<{ events: ParcelHistoryEvent[] }, string>({
      query: (id) => ({ url: `/shipments/parcels/${id}/history` }),
      providesTags: (_result, _error, id) => [{ type: 'Bookings', id }],
    }),
  }),
});

export const { useGetParcelHistoryQuery } = parcelHistoryApi;
