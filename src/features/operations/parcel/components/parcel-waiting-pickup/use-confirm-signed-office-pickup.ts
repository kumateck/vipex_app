import { api } from '@/services/api';

export type PickupOtpException = { id: string; signatureImage: string };

const pickupApi = api.injectEndpoints({
  endpoints: (builder) => ({
    confirmSignedOfficePickup: builder.mutation<
      { id: string },
      {
        id: string;
        confirmedBy: string;
        handoverTarget: 'main' | 'second';
        signatureImage: string;
        expectedMainReceiverId: string;
        expectedSecondReceiverId: string | null;
        secondReceiverId: string | null;
        cardId: string | null;
        cardNumber: string | null;
        secondCardId: string | null;
        secondCardNumber: string | null;
        otpAuthorizationId: string;
      }
    >({
      query: ({ id, ...body }) => ({
        url: `/shipments/parcels/${id}/confirm-office-pickup`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_result, error, { id }) =>
        error
          ? []
          : [
              { type: 'Bookings', id: 'LIST' },
              { type: 'Bookings', id },
            ],
    }),
  }),
});

export const { useConfirmSignedOfficePickupMutation } = pickupApi;
