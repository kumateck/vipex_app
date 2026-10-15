import { api } from '@/services/api';

export type SetParcelSecondReceiverInput = {
  id: string;
  fullname: string;
  telephone: string;
};

export type SetParcelSecondReceiverResponse = {
  id: string;
  secondReceiverId: string | null;
  changed: boolean;
};

const invalidatesTags = [
  { type: 'Bookings' as const, id: 'LIST' },
  { type: 'Customers' as const, id: 'LIST' },
];

export const parcelSecondReceiverApi = api.injectEndpoints({
  endpoints: (builder) => ({
    setParcelSecondReceiver: builder.mutation<
      SetParcelSecondReceiverResponse,
      SetParcelSecondReceiverInput
    >({
      query: ({ id, ...body }) => ({
        url: `/shipments/parcels/${id}/second-receiver`,
        method: 'PUT',
        body,
      }),
      invalidatesTags,
    }),
    removeParcelSecondReceiver: builder.mutation<SetParcelSecondReceiverResponse, { id: string }>({
      query: ({ id }) => ({
        url: `/shipments/parcels/${id}/second-receiver`,
        method: 'DELETE',
      }),
      invalidatesTags,
    }),
  }),
});

export const { useSetParcelSecondReceiverMutation, useRemoveParcelSecondReceiverMutation } =
  parcelSecondReceiverApi;
