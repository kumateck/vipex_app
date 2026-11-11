import { api } from '@/services/api';
import type { ParcelHandoverNote } from '../types';

const handoverNoteApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getParcelHandoverNote: builder.query<ParcelHandoverNote, string>({
      query: (id) => `/shipments/parcels/${id}/handover-note`,
      providesTags: (_result, _error, id) => [{ type: 'Bookings', id }],
      keepUnusedDataFor: 0,
    }),
    saveParcelHandoverNote: builder.mutation<
      ParcelHandoverNote,
      { id: string; note: string; expectedNote: string | null }
    >({
      query: ({ id, ...body }) => ({
        url: `/shipments/parcels/${id}/handover-note`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_result, error, { id }) =>
        error ? [] : ['Bookings', { type: 'Bookings', id }],
    }),
  }),
});

export const { useGetParcelHandoverNoteQuery, useSaveParcelHandoverNoteMutation } = handoverNoteApi;
