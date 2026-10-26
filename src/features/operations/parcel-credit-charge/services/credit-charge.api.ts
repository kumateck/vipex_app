import { api } from '@/services/api';
import type { ChargeCorrection } from '../types';
const creditChargeApi = api.injectEndpoints({
  endpoints: (builder) => ({
    updateCreditCharge: builder.mutation<
      { id: string; status: 'PENDING_APPROVAL' },
      {
        parcelId: string;
        chargeCedis: string;
        expectedChargePsw: 0;
        method: 4;
        reason: string;
      }
    >({
      query: ({ parcelId, ...body }) => ({
        url: `/shipments/parcels/${parcelId}/credit-charge`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Bookings'],
    }),
    listChargeCorrections: builder.query<
      { data: ChargeCorrection[]; hasNextPage: boolean },
      { page?: number; search?: string; parcelId?: string; cacheScope: string }
    >({
      query: ({ cacheScope: _cacheScope, ...params }) => ({
        url: '/shipments/parcels/charge-corrections',
        params,
      }),
      keepUnusedDataFor: 0,
      providesTags: ['Bookings'],
    }),
    reviewChargeCorrection: builder.mutation<
      { id: string },
      { id: string; approve: boolean; note?: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/shipments/parcels/charge-corrections/${id}/review`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Bookings', 'Customers', 'CustomerWalletCredit'],
    }),
  }),
});
export const {
  useUpdateCreditChargeMutation,
  useListChargeCorrectionsQuery,
  useReviewChargeCorrectionMutation,
} = creditChargeApi;
