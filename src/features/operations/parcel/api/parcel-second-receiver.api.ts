import { api } from '@/services/api';

export type SetParcelSecondReceiverInput = {
  id: string;
  fullname: string;
  telephone: string;
};

export type SetParcelSecondReceiverResponse = {
  id: string;
  secondReceiverId: string;
  changed: boolean;
};

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
      invalidatesTags: [
        { type: 'Bookings', id: 'LIST' },
        { type: 'Customers', id: 'LIST' },
      ],
    }),
  }),
});

export const { useSetParcelSecondReceiverMutation } = parcelSecondReceiverApi;
