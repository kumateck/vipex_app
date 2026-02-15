import { api } from '@/services/api';

export interface Booking {
  id: string;
  senderId: string;
  companyId: string;
  sourceId: string;
  statusId: string;
  createdAt: string;
  updatedAt?: string;
}

export const bookingsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listBookings: builder.query<{ data: Booking[] }, { companyId?: string; limit?: number }>({
      query: (params) => ({ url: '/shipments/bookings', params }),
      providesTags: ['Bookings'],
    }),
  }),
});

export const { useListBookingsQuery } = bookingsApi;
