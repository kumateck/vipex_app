import { api } from '@/services/api';
import type { ShelfPickupList, ShelfPickupScope } from '../types';
import { useListShelfPickerStaffQuery } from '../../parcel-shelf-picker-update/services';

const shelfPickupReassignmentApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listShelfPickupReassignments: builder.query<
      ShelfPickupList,
      ShelfPickupScope & { search?: string; page: number; pageSize: number }
    >({
      query: ({ search, page, pageSize }) => ({
        url: '/shipments/parcels/shelf-picker-reassignments',
        params: { search, page, pageSize },
      }),
      providesTags: [{ type: 'Bookings', id: 'LIST' }],
    }),
    reassignShelfPickup: builder.mutation<
      { success: boolean; parcelId: string; pickerStaffId: string; changed: boolean },
      {
        parcelId: string;
        userId: string;
        expectedPickerStaffId: string | null;
      }
    >({
      query: ({ parcelId, ...body }) => ({
        url: `/shipments/parcels/${parcelId}/update-shelf-picker`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Bookings'],
    }),
  }),
});

export const { useListShelfPickupReassignmentsQuery, useReassignShelfPickupMutation } =
  shelfPickupReassignmentApi;
export { useListShelfPickerStaffQuery };
