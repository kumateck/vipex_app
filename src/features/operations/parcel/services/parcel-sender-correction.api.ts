import { api } from '@/services/api';
import type { BookingCustomer } from './parcel-booking-customers.api';
const senderCorrectionApi = api.injectEndpoints({
  endpoints: (builder) => ({
    findParcelSenderCandidates: builder.query<
      BookingCustomer[],
      { parcelId: string; telephone: string }
    >({
      query: ({ parcelId, telephone }) => ({
        url: `/shipments/parcels/${parcelId}/sender-candidates`,
        params: { telephone },
      }),
    }),
    correctParcelSender: builder.mutation<
      { id: string; changed: boolean },
      {
        parcelId: string;
        expectedSenderId: string;
        customerId: string;
        telephone: string;
        reason: string;
      }
    >({
      query: ({ parcelId, ...body }) => ({
        url: `/shipments/parcels/${parcelId}/correct-sender`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_result, error) =>
        error ? [] : [{ type: 'Bookings' }, { type: 'Customers', id: 'LIST' }],
    }),
  }),
});
export const { useLazyFindParcelSenderCandidatesQuery, useCorrectParcelSenderMutation } =
  senderCorrectionApi;
