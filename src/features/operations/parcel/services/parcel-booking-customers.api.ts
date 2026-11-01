import { api } from '@/services/api';

export type BookingCustomer = {
  id: string;
  fullname: string;
  customerType?: number;
  telephone: string | null;
  telephone2: string | null;
};
const bookingCustomersApi = api.injectEndpoints({
  endpoints: (builder) => ({
    lookupBookingCustomers: builder.query<BookingCustomer[], { telephone: string }>({
      query: ({ telephone }) => ({
        url: `/customers/lookup/booking-by-telephone/${encodeURIComponent(telephone)}`,
      }),
      providesTags: (rows) => [
        { type: 'Customers', id: 'LIST' },
        ...(rows ?? []).map(({ id }) => ({ type: 'Customers' as const, id })),
      ],
    }),
  }),
});
export const { useLookupBookingCustomersQuery } = bookingCustomersApi;
