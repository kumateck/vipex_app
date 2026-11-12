import { api } from '@/services/api';
import type { ReceivingOfficeOption } from '@/shared/shipments/receiving-office';

const receivingOfficesApi = api.injectEndpoints({
  endpoints: (builder) => ({
    receivingOfficeOptions: builder.query<ReceivingOfficeOption[], string>({
      query: () => '/locations/receiving-offices/options',
      providesTags: [{ type: 'Locations', id: 'RECEIVING_OFFICES' }],
    }),
    locationReceivingOffices: builder.query<ReceivingOfficeOption[], string>({
      query: (locationId) => `/locations/${locationId}/receiving-offices`,
      providesTags: [{ type: 'Locations', id: 'RECEIVING_OFFICES' }],
    }),
    saveLocationOffice: builder.mutation<
      { id: string; name: string },
      { locationId: string; officeId?: string; name: string }
    >({
      query: ({ locationId, officeId, name }) => ({
        url: `/locations/${locationId}/receiving-offices${officeId ? `/${officeId}` : ''}`,
        method: officeId ? 'PATCH' : 'POST',
        body: { name },
      }),
      invalidatesTags: (_result, error) =>
        error ? [] : [{ type: 'Locations', id: 'RECEIVING_OFFICES' }, 'Bookings'],
    }),
    assignParcelReceivingOffice: builder.mutation<
      { receivingOfficeId: string; receivingOfficeName: string },
      { parcelId: string; receivingOfficeId: string }
    >({
      query: ({ parcelId, receivingOfficeId }) => ({
        url: `/shipments/parcels/${parcelId}/receiving-office`,
        method: 'PATCH',
        body: { receivingOfficeId },
      }),
      invalidatesTags: (_result, error, { parcelId }) =>
        error
          ? []
          : [
              { type: 'Bookings', id: 'LIST' },
              { type: 'Bookings', id: parcelId },
            ],
    }),
  }),
});

export const {
  useReceivingOfficeOptionsQuery,
  useLocationReceivingOfficesQuery,
  useSaveLocationOfficeMutation,
  useAssignParcelReceivingOfficeMutation,
} = receivingOfficesApi;
