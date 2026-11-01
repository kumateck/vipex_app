import { api } from '@/services/api';
import {
  buildServerPaginationParams,
  invalidateEntityListTag,
  provideEntityListTags,
  type ServerListQuery,
  type ServerListResponse,
} from '@/services/rtk-query';
import { useAuthStore } from '@/stores/auth-store';
import {
  type Customer,
  type CustomerFilters,
  type CreateCustomerInput,
  type UpdateCustomerInput,
  type CustomerCardOption,
  type CustomerCardRecord,
  type CustomerCreditSummary,
  type CustomerCreditTransaction,
  type CustomerCreditOpenItem,
  type CustomerTransaction,
  type CustomerPayment,
  type CustomerPaymentsMonthly,
  type CustomerTransactionsMonthly,
  type CustomerStatement,
} from './customer-api.types';

export const customersApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listCustomers: builder.query<
      ServerListResponse<Customer>,
      ServerListQuery<CustomerFilters> | void
    >({
      query: (query) => ({
        url: '/customers',
        params: buildServerPaginationParams(query),
      }),
      providesTags: (result) => provideEntityListTags('Customers', result),
    }),
    getCustomerById: builder.query<Customer, string>({
      query: (id) => ({
        url: `/customers/${id}`,
      }),
      providesTags: (_result, _error, id) => [{ type: 'Customers', id }],
    }),
    findCustomersByTelephone: builder.query<Customer[], { telephone: string; limit?: number }>({
      query: ({ telephone, limit = 10 }) => ({
        url: `/customers/lookup/by-telephone/${encodeURIComponent(telephone)}`,
        params: { limit },
      }),
      providesTags: [{ type: 'Customers', id: 'PHONE_LOOKUP' }],
    }),
    createCustomer: builder.mutation<{ id: string }, CreateCustomerInput>({
      query: (body) => {
        const user = useAuthStore.getState().user;
        if (!user?.id) throw new Error('Not authenticated');

        return {
          url: '/customers',
          method: 'POST',
          body,
        };
      },
      invalidatesTags: invalidateEntityListTag('Customers'),
    }),
    resolveSecondReceiver: builder.mutation<
      { id: string },
      { fullname: string; telephone: string }
    >({
      query: (body) => ({
        url: '/customers/resolve-second-receiver',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Customers', id: 'LIST' }],
    }),
    createCustomerCrm: builder.mutation<{ id: string }, CreateCustomerInput>({
      query: (body) => {
        const user = useAuthStore.getState().user;
        if (!user?.id) throw new Error('Not authenticated');

        return {
          url: '/customers/crm',
          method: 'POST',
          body,
        };
      },
      invalidatesTags: invalidateEntityListTag('Customers'),
    }),
    updateCustomer: builder.mutation<{ id: string }, UpdateCustomerInput>({
      query: ({ id, ...body }) => ({
        url: `/customers/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Customers', id },
        ...invalidateEntityListTag('Customers'),
      ],
    }),
    updateCustomerCrm: builder.mutation<{ id: string }, UpdateCustomerInput>({
      query: ({ id, ...body }) => ({
        url: `/customers/${id}/crm`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Customers', id },
        ...invalidateEntityListTag('Customers'),
      ],
    }),
    deleteCustomer: builder.mutation<{ success: true }, { id: string }>({
      query: ({ id }) => ({
        url: `/customers/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: invalidateEntityListTag('Customers'),
    }),
    listCardOptions: builder.query<CustomerCardOption[], void>({
      query: () => ({
        url: '/customers/cards/options',
      }),
      providesTags: [{ type: 'Customers', id: 'CARD_OPTIONS' }],
    }),
    listCustomerCards: builder.query<CustomerCardRecord[], { customerId: string }>({
      query: ({ customerId }) => ({
        url: `/customers/${customerId}/cards`,
      }),
      providesTags: (_result, _error, { customerId }) => [
        { type: 'Customers', id: `CARDS:${customerId}` },
      ],
    }),
    addCustomerCard: builder.mutation<
      { id: string },
      {
        customerId: string;
        cardId: string;
        cardNumber: string;
        frontImageUrl?: string | null;
        backImageUrl?: string | null;
      }
    >({
      query: ({ customerId, ...body }) => ({
        url: `/customers/${customerId}/cards`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_result, _error, { customerId }) => [
        { type: 'Customers', id: `CARDS:${customerId}` },
      ],
    }),
    updateCustomerCard: builder.mutation<
      { id: string },
      {
        customerId: string;
        cardRecordId: string;
        cardId?: string;
        cardNumber?: string;
        frontImageUrl?: string | null;
        backImageUrl?: string | null;
      }
    >({
      query: ({ customerId, cardRecordId, ...body }) => ({
        url: `/customers/${customerId}/cards/${cardRecordId}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_result, _error, { customerId }) => [
        { type: 'Customers', id: `CARDS:${customerId}` },
      ],
    }),
    getCustomerCreditSummary: builder.query<CustomerCreditSummary, { customerId: string }>({
      query: ({ customerId }) => ({
        url: `/customers/${customerId}/credit/summary`,
      }),
      providesTags: (_result, _error, { customerId }) => [
        { type: 'Customers', id: `CREDIT_SUMMARY:${customerId}` },
      ],
    }),
    listCustomerCreditTransactions: builder.query<
      CustomerCreditTransaction[],
      { customerId: string; limit?: number; dateFrom?: string; dateTo?: string }
    >({
      query: ({ customerId, limit = 100, dateFrom, dateTo }) => ({
        url: `/customers/${customerId}/credit/transactions`,
        params: { limit, dateFrom, dateTo },
      }),
      providesTags: (_result, _error, { customerId }) => [
        { type: 'Customers', id: `CREDIT_TX:${customerId}` },
      ],
    }),
    getCustomerStatement: builder.query<
      CustomerStatement,
      { customerId: string; dateFrom?: string; dateTo?: string }
    >({
      query: ({ customerId, dateFrom, dateTo }) => ({
        url: `/customers/${customerId}/statement`,
        params: {
          dateFrom,
          dateTo,
        },
      }),
      providesTags: (_result, _error, { customerId }) => [
        { type: 'Customers', id: `STATEMENT:${customerId}` },
      ],
    }),
    listCustomerTransactions: builder.query<
      ServerListResponse<CustomerTransaction>,
      { customerId: string; page?: number; pageSize?: number; dateFrom?: string; dateTo?: string }
    >({
      query: ({ customerId, page = 1, pageSize = 30, dateFrom, dateTo }) => ({
        url: `/customers/${customerId}/transactions`,
        params: { page, pageSize, dateFrom, dateTo },
      }),
      providesTags: (_result, _error, { customerId }) => [
        { type: 'Customers', id: `TRANSACTIONS:${customerId}` },
      ],
    }),
    listCustomerPayments: builder.query<
      ServerListResponse<CustomerPayment>,
      { customerId: string; page?: number; pageSize?: number; dateFrom?: string; dateTo?: string }
    >({
      query: ({ customerId, page = 1, pageSize = 30, dateFrom, dateTo }) => ({
        url: `/customers/${customerId}/payments`,
        params: { page, pageSize, dateFrom, dateTo },
      }),
      providesTags: (_result, _error, { customerId }) => [
        { type: 'Customers', id: `PAYMENTS:${customerId}` },
      ],
    }),
    getCustomerPaymentsMonthly: builder.query<
      CustomerPaymentsMonthly,
      { customerId: string; year?: number }
    >({
      query: ({ customerId, year }) => ({
        url: `/customers/${customerId}/payments/monthly`,
        params: { year },
      }),
      providesTags: (_result, _error, { customerId }) => [
        { type: 'Customers', id: `PAYMENTS_MONTHLY:${customerId}` },
      ],
    }),
    getCustomerTransactionsMonthly: builder.query<
      CustomerTransactionsMonthly,
      { customerId: string; year?: number }
    >({
      query: ({ customerId, year }) => ({
        url: `/customers/${customerId}/transactions/monthly`,
        params: { year },
      }),
      providesTags: (_result, _error, { customerId }) => [
        { type: 'Customers', id: `TRANSACTIONS_MONTHLY:${customerId}` },
      ],
    }),
    listCustomerCreditOpenItems: builder.query<
      CustomerCreditOpenItem[],
      { customerId: string; dateFrom?: string; dateTo?: string }
    >({
      query: ({ customerId, dateFrom, dateTo }) => ({
        url: `/customers/${customerId}/credit/open-items`,
        params: { dateFrom, dateTo },
      }),
      providesTags: (_result, _error, { customerId }) => [
        { type: 'Customers', id: `CREDIT_OPEN:${customerId}` },
      ],
    }),
    postCustomerCreditPayment: builder.mutation<
      {
        id: string;
        allocatedAmountPsw: number;
        unallocatedAmountPsw: number;
        allocations: Array<{ chargeTransactionId: string; amountPsw: number }>;
      },
      {
        customerId: string;
        parcelIds: string[];
        amountCedis: number | string;
        notes?: string;
        referenceId?: string;
      }
    >({
      query: ({ customerId, ...body }) => ({
        url: `/customers/${customerId}/credit/payments`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_result, _error, { customerId }) => [
        { type: 'Customers', id: `CREDIT_SUMMARY:${customerId}` },
        { type: 'Customers', id: `CREDIT_TX:${customerId}` },
        { type: 'Customers', id: `CREDIT_OPEN:${customerId}` },
        { type: 'Customers', id: `STATEMENT:${customerId}` },
        { type: 'Customers', id: `PAYMENTS:${customerId}` },
        { type: 'Customers', id: `PAYMENTS_MONTHLY:${customerId}` },
      ],
    }),
  }),
});
