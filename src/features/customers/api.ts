import { api } from '@/services/api';
import {
  buildServerPaginationParams,
  invalidateEntityListTag,
  provideEntityListTags,
  type ServerListQuery,
  type ServerListResponse,
} from '@/services/rtk-query';
import { useAuthStore } from '@/stores/auth-store';

export enum CustomerType {
  Individual = 0,
  Business = 1,
}

export interface Customer {
  id: string;
  companyId: string;
  fullname: string;
  telephone?: string;
  telephone2?: string;
  address?: string;
  email?: string;
  customerType: CustomerType;
  creditEligible: boolean;
  creditLimitPsw: number;
  paymentTermsDays: number;
  isNiaVerified: boolean;
  loggedToGovernment: boolean;
  createdAt: string;
}

export interface CustomerFilters {
  companyId?: string;
  includeDeleted?: boolean | null;
}

export interface CreateCustomerInput {
  fullname: string;
  telephone?: string | null;
  telephone2?: string | null;
  address?: string | null;
  email?: string | null;
  customerType?: CustomerType;
  creditEligible?: boolean;
  creditLimitPsw?: number;
  paymentTermsDays?: number;
  isNiaVerified?: boolean;
  loggedToGovernment?: boolean;
}

export interface UpdateCustomerInput {
  id: string;
  fullname?: string;
  telephone?: string | null;
  telephone2?: string | null;
  address?: string | null;
  email?: string | null;
  customerType?: CustomerType;
  creditEligible?: boolean;
  creditLimitPsw?: number;
  paymentTermsDays?: number;
  isNiaVerified?: boolean;
  loggedToGovernment?: boolean;
}

export interface CustomerCardOption {
  id: string;
  name: string;
}

export interface CustomerCardRecord {
  id: string;
  customerId: string;
  cardId: string;
  cardName: string;
  cardNumber: string;
  createdAt: string;
}

export interface CustomerCreditSummary {
  balancePsw: number;
  balanceCedis: number;
  creditLimitPsw: number;
  availableCreditPsw: number | null;
}

export interface CustomerCreditTransaction {
  id: string;
  companyId: string;
  customerId: string;
  sourceType: number;
  transactionType: number;
  referenceId?: string | null;
  signedAmountPsw: number;
  notes?: string | null;
  createdBy: string;
  createdAt: string;
}

export interface CustomerCreditOpenItem {
  chargeTransactionId: string;
  createdAt: string;
  referenceId?: string | null;
  notes?: string | null;
  chargeAmountPsw: number;
  allocatedAmountPsw: number;
  outstandingAmountPsw: number;
}

export interface CustomerTransaction {
  id: string;
  bookingCode: string;
  trackingCode: string;
  sourceId: string;
  destinationId: string;
  status: number;
  chargePsw: number;
  method: number;
  transactionRole: 'SENDER' | 'RECEIVER';
  createdAt: string;
}

export interface CustomerPayment {
  id: string;
  source: 'PARCEL_PAYMENT' | 'CREDIT_PAYMENT';
  amountPsw: number;
  method: number | null;
  bookingCode: string | null;
  trackingCode: string | null;
  notes: string | null;
  createdAt: string;
}

export interface CustomerPaymentsMonthly {
  year: number;
  yearTotalPsw: number;
  months: Array<{
    month: number;
    monthLabel: string;
    totalPsw: number;
    parcelPaymentsPsw: number;
    creditPaymentsPsw: number;
  }>;
}

export interface CustomerTransactionsMonthly {
  year: number;
  totalSentCount: number;
  totalReceivedCount: number;
  totalSentAmountPsw: number;
  totalReceivedAmountPsw: number;
  months: Array<{
    month: number;
    monthLabel: string;
    sentCount: number;
    receivedCount: number;
    sentAmountPsw: number;
    receivedAmountPsw: number;
  }>;
}

export interface CustomerStatementRow {
  id: string;
  timestamp: string;
  entryType: 'PARCEL_SENT' | 'PARCEL_RECEIVED' | 'PAYMENT' | 'CREDIT';
  direction: 'debit' | 'credit' | 'info';
  amountPsw: number | null;
  parcelId: string | null;
  bookingCode: string | null;
  trackingCode: string | null;
  method: number | null;
  notes: string;
}

export interface CustomerStatement {
  customer: {
    id: string;
    fullname: string;
    customerType: number;
  };
  range: {
    dateFrom: string | null;
    dateTo: string | null;
  };
  summary: {
    sentParcels: number;
    receivedParcels: number;
    totalSentChargePsw: number;
    totalReceivingToPayPsw: number;
    paymentsMadeByCustomerPsw: number;
    creditChargesPsw: number;
    creditPaymentsPsw: number;
    openingCreditBalancePsw: number;
    closingCreditBalancePsw: number;
  };
  rows: CustomerStatementRow[];
}

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
        { type: 'Customers', id: 'LIST' },
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
        { type: 'Customers', id: 'LIST' },
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
      { customerId: string; cardId: string; cardNumber: string }
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
      { customerId: string; amountCedis: number | string; notes?: string; referenceId?: string }
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
        { type: 'Customers', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useListCustomersQuery,
  useGetCustomerByIdQuery,
  useFindCustomersByTelephoneQuery,
  useCreateCustomerMutation,
  useCreateCustomerCrmMutation,
  useUpdateCustomerMutation,
  useUpdateCustomerCrmMutation,
  useDeleteCustomerMutation,
  useListCardOptionsQuery,
  useListCustomerCardsQuery,
  useAddCustomerCardMutation,
  useGetCustomerCreditSummaryQuery,
  useListCustomerCreditTransactionsQuery,
  useGetCustomerStatementQuery,
  useListCustomerTransactionsQuery,
  useListCustomerPaymentsQuery,
  useGetCustomerPaymentsMonthlyQuery,
  useGetCustomerTransactionsMonthlyQuery,
  useListCustomerCreditOpenItemsQuery,
  usePostCustomerCreditPaymentMutation,
} = customersApi;
