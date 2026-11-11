import { api } from '@/services/api';
import type { CorrectionCustomer, CorrectionParcel, CustomerCorrectionInput } from '../types';

const correctionsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    findCorrectionParcels: builder.query<CorrectionParcel[], string>({
      query: (bookingCode) => ({
        url: '/shipments/parcels/customer-corrections/lookup',
        params: { bookingCode },
      }),
    }),
    findCorrectionCustomers: builder.query<CorrectionCustomer[], string>({
      query: (telephone) => ({
        url: '/shipments/parcels/customer-corrections/customers',
        params: { telephone },
      }),
    }),
    correctParcelCustomer: builder.mutation<CorrectionParcel, CustomerCorrectionInput>({
      query: ({ parcelId, ...body }) => ({
        url: `/shipments/parcels/customer-corrections/${parcelId}`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_result, error) => (error ? [] : ['Bookings', 'Customers']),
    }),
  }),
});

export const {
  useLazyFindCorrectionParcelsQuery,
  useLazyFindCorrectionCustomersQuery,
  useCorrectParcelCustomerMutation,
} = correctionsApi;
