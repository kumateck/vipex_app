import { api } from '@/services/api';
import type { CreditParcel, CreditSettlementInput, SettlementProps } from '../types';

const creditSettlementApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listSettlementParcels: builder.query<CreditParcel[], SettlementProps>({
      query: ({ customerId, channel }) => ({
        url:
          channel === 'finance'
            ? `/customer-wallet-credit/accounts/${customerId}/open-parcels`
            : `/customers/${customerId}/credit/parcels`,
      }),
      providesTags: ['Customers', 'CustomerWalletCredit'],
    }),
    settleCreditParcels: builder.mutation<{ id: string }, SettlementProps & CreditSettlementInput>({
      query: ({ customerId, channel, ...body }) => ({
        url:
          channel === 'finance'
            ? `/customer-wallet-credit/accounts/${customerId}/payments`
            : `/customers/${customerId}/credit/payments`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Customers', 'CustomerWalletCredit', 'Bookings'],
    }),
  }),
});
export const { useListSettlementParcelsQuery, useSettleCreditParcelsMutation } =
  creditSettlementApi;
