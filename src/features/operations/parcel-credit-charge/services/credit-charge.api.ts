import { api } from '@/services/api';
const creditChargeApi = api.injectEndpoints({
  endpoints: (builder) => ({
    updateCreditCharge: builder.mutation<
      { id: string; chargePsw: number },
      {
        parcelId: string;
        chargeCedis: string;
        expectedChargePsw: number;
        reason: string;
      }
    >({
      query: ({ parcelId, ...body }) => ({
        url: `/parcels/${parcelId}/credit-charge`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Customers', 'CustomerWalletCredit', 'Bookings'],
    }),
  }),
});
export const { useUpdateCreditChargeMutation } = creditChargeApi;
