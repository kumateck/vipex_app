import { api } from '@/services/api';
import {
  buildServerPaginationParams,
  provideEntityListTags,
  type ServerListQuery,
  type ServerListResponse,
} from '@/services/rtk-query';

export interface Booking {
  id: string;
  senderId: string;
  companyId: string;
  sourceId: string;
  statusId: string;
  createdAt: string;
  updatedAt?: string;
}

export interface BookingFilters {
  companyId?: string | null;
  senderId?: string | null;
  sourceId?: string | null;
}

export const bookingsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listBookings: builder.query<ServerListResponse<Booking>, ServerListQuery<BookingFilters> | void>({
      query: (query) => ({
        url: '/shipments/bookings',
        params: buildServerPaginationParams(query),
      }),
      providesTags: (result) => provideEntityListTags('Bookings', result),
    }),
  }),
});

export const { useListBookingsQuery } = bookingsApi;
