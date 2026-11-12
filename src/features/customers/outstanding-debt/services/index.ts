import { api } from '@/services/api';
import type { OutstandingDebtStatement } from '@/shared/customers/outstanding-debt';

const outstandingDebtApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getOutstandingDebt: builder.query<OutstandingDebtStatement, string>({
      query: (customerId) => ({
        url: `/customers/${customerId}/credit/outstanding-statement`,
      }),
      providesTags: ['Customers', 'CustomerWalletCredit', 'Bookings'],
    }),
  }),
});

export const { useGetOutstandingDebtQuery } = outstandingDebtApi;
