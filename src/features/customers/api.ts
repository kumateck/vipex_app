import { api } from '@/services/api';
import {
  buildServerPaginationParams,
  invalidateEntityListTag,
  provideEntityListTags,
  type ServerListQuery,
  type ServerListResponse,
} from '@/services/rtk-query';
import { useAuthStore } from '@/stores/auth-store';

export interface Customer {
  id: string;
  companyId: string;
  fullname: string;
  telephone?: string;
  email?: string;
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
  isNiaVerified?: boolean;
  loggedToGovernment?: boolean;
}

export interface UpdateCustomerInput {
  id: string;
  fullname?: string;
  telephone?: string | null;
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
    updateCustomer: builder.mutation<{ id: string }, UpdateCustomerInput>({
      query: ({ id, ...body }) => ({
        url: `/customers/${id}`,
        method: 'PATCH',
        body,
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
  }),
});

export const {
  useListCustomersQuery,
  useFindCustomersByTelephoneQuery,
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
  useListCardOptionsQuery,
  useListCustomerCardsQuery,
  useAddCustomerCardMutation,
} = customersApi;
