import { api } from '@/services/api';
import type { ParcelInformationEdit } from '@/shared/shipments/parcel-information-edit';

const parcelInformationEditApi = api.injectEndpoints({
  endpoints: (builder) => ({
    editParcelInformation: builder.mutation<{ id: string }, ParcelInformationEdit>({
      query: ({ id, ...body }) => ({
        url: `/shipments/parcels/${id}/edit-information`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_result, error, { receiver }) =>
        error
          ? []
          : [
              { type: 'Bookings' },
              ...(receiver
                ? [
                    { type: 'Customers' as const, id: receiver.id },
                    { type: 'Customers' as const, id: 'LIST' },
                  ]
                : []),
            ],
    }),
  }),
});

export const { useEditParcelInformationMutation } = parcelInformationEditApi;
