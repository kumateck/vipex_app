import { api } from '@/services/api';

export type CreateBookingWithParcelsInput = {
  senderId: string;
  statusId: string;
  cashierSessionId?: string | null;
  parcels: Array<{
    destinationId: string;
    receiverId: string;
    statusId: string;
    parcelDetails: string;
    parcelContent: string;
    method: number;
    parcelValueCedis?: number;
    plannedToBePaidCedis?: number;
    senderPaymentCedis?: number;
    senderPaymentMethod?: number;
  }>;
};

export type CreateBookingWithParcelsResponse = {
  bookingId: string;
  parcels: Array<{ id: string; trackingCode: string }>;
  payments: Array<{ id: string }>;
};

export const parcelApi = api.injectEndpoints({
  endpoints: (builder) => ({
    createBookingWithParcels: builder.mutation<
      CreateBookingWithParcelsResponse,
      CreateBookingWithParcelsInput
    >({
      query: (body) => ({
        url: '/shipments/bookings/create-with-parcels',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Bookings', id: 'LIST' }],
    }),
  }),
});

export const { useCreateBookingWithParcelsMutation } = parcelApi;
