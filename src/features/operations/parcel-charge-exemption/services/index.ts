import { api } from '@/services/api';

const receivingStaffApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listParcelReceivingStaff: builder.query<
      Array<{ id: string; fullname: string; employeeNumber: string }>,
      { destinationId: string; source: 'booking' | 'self-service' }
    >({
      query: ({ destinationId, source }) => ({
        url:
          source === 'self-service'
            ? '/self-service/receiving-staff-options'
            : '/shipments/bookings/receiving-staff-options',
        params: { destinationId },
      }),
      providesTags: [{ type: 'Users', id: 'OPTIONS' }],
    }),
  }),
});
export const { useListParcelReceivingStaffQuery } = receivingStaffApi;
